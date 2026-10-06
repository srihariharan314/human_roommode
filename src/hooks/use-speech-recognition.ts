'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onFinalTranscript: (text: string, startMs: number, endMs: number) => void;
  enabled: boolean;
}

export function useSpeechRecognition({ onFinalTranscript, enabled }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechStartRef = useRef<number>(0);

  // Audio level monitoring
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setAudioLevel(normalized);
        setIsSpeaking(normalized > 15);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setPermissionError(null);
    } catch (err: any) {
      console.warn('Microphone permission or audio context error:', err);
      setPermissionError('Microphone permission is required to participate by voice.');
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
    setIsSpeaking(false);
  }, []);

  // Speech recognition initialization
  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioAnalysis();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Browser does not support Web Speech API SpeechRecognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      speechStartRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptText = item[0].transcript;

        if (item.isFinal) {
          const endMs = Date.now();
          const startMs = speechStartRef.current || (endMs - 3000);
          if (transcriptText.trim().length > 0) {
            onFinalTranscript(transcriptText.trim(), startMs, endMs);
          }
          currentInterim = '';
          speechStartRef.current = Date.now();
        } else {
          currentInterim += transcriptText;
        }
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setPermissionError('Microphone permission is denied.');
      }
      console.warn('Speech recognition event:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if enabled
      if (enabled) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      startAudioAnalysis();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
    }

    return () => {
      try {
        recognition.stop();
      } catch {}
      stopAudioAnalysis();
    };
  }, [enabled, onFinalTranscript, startAudioAnalysis, stopAudioAnalysis]);

  return {
    isListening,
    interimText,
    audioLevel,
    isSpeaking,
    permissionError,
  };
}
