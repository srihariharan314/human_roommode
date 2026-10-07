'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type MicStatus = 'READY' | 'LISTENING' | 'MUTED' | 'PERMISSION_REQUIRED' | 'UNAVAILABLE';

interface UseSpeechRecognitionProps {
  onFinalTranscript: (text: string, startMs: number, endMs: number) => void;
  enabled: boolean;
}

export function useSpeechRecognition({ onFinalTranscript, enabled }: UseSpeechRecognitionProps) {
  const [micStatus, setMicStatus] = useState<MicStatus>('READY');
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechStartRef = useRef<number>(0);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabledRef = useRef(enabled);
  const currentInterimRef = useRef<string>('');
  const onFinalCallbackRef = useRef(onFinalTranscript);

  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onFinalCallbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Flush any pending interim speech as final transcript
  const flushInterim = useCallback(() => {
    const textToCommit = currentInterimRef.current.trim();
    if (textToCommit.length > 0) {
      const endMs = Date.now();
      const startMs = speechStartRef.current || (endMs - 2000);
      onFinalCallbackRef.current(textToCommit, startMs, endMs);
      currentInterimRef.current = '';
      setInterimText('');
      speechStartRef.current = Date.now();
    }
  }, []);

  // Audio level monitoring via Web Audio API
  const startAudioAnalysis = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
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
          const speakingNow = normalized > 12;
          setIsSpeaking(speakingNow);

          if (isEnabledRef.current) {
            setMicStatus(speakingNow ? 'LISTENING' : 'READY');
          }

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      }

      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('PERMISSION_REQUIRED');
        setErrorMessage('Microphone access is blocked. Please allow microphone permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicStatus('UNAVAILABLE');
        setErrorMessage('No microphone detected on your device.');
      } else {
        setMicStatus('PERMISSION_REQUIRED');
        setErrorMessage('Microphone permission is required to participate in discussion.');
      }
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

  // Speech recognition initialization & lifecycle
  useEffect(() => {
    if (!enabled) {
      // Flush any pending text before shutting down
      flushInterim();
      setMicStatus('MUTED');
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioAnalysis();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatus('UNAVAILABLE');
      setErrorMessage('Browser speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or use the text conversation box below.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setMicStatus('READY');
      if (!speechStartRef.current) {
        speechStartRef.current = Date.now();
      }
    };

    recognition.onresult = (event: any) => {
      let fullInterim = '';
      let hasFinal = false;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptText = (item[0]?.transcript || '').trim();

        if (item.isFinal) {
          hasFinal = true;
          const endMs = Date.now();
          const startMs = speechStartRef.current || (endMs - 2500);
          
          if (transcriptText.length > 0) {
            onFinalCallbackRef.current(transcriptText, startMs, endMs);
          }
          currentInterimRef.current = '';
          setInterimText('');
          speechStartRef.current = Date.now();
        } else {
          fullInterim += (fullInterim ? ' ' : '') + transcriptText;
        }
      }

      if (!hasFinal && fullInterim.length > 0) {
        currentInterimRef.current = fullInterim;
        setInterimText(fullInterim);

        // Auto-commit if user pauses for 1.4 seconds after speaking a substantive sentence
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterimRef.current.trim().length > 0) {
            flushInterim();
          }
        }, 1400);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicStatus('PERMISSION_REQUIRED');
        setErrorMessage('Microphone access denied. Click the lock/settings icon in your browser address bar to allow microphone.');
      } else if (event.error === 'no-speech') {
        // Normal silence timeout, ignore
      } else if (event.error === 'network') {
        console.warn('Speech recognition network blip, recovering...');
      } else {
        console.warn('Speech recognition event:', event.error);
      }
    };

    recognition.onend = () => {
      // Flush any lingering interim text so words are not lost
      flushInterim();

      // Graceful auto-restart with backoff if still active & enabled
      if (isEnabledRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            if (isEnabledRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch {
            // Already started or restarting
          }
        }, 150);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      startAudioAnalysis();
    } catch (err) {
      console.warn('Recognition start exception:', err);
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      flushInterim();
      try {
        recognition.stop();
      } catch {}
      stopAudioAnalysis();
      setInterimText('');
    };
  }, [enabled, flushInterim, startAudioAnalysis, stopAudioAnalysis]);

  return {
    micStatus,
    interimText,
    audioLevel,
    isSpeaking,
    errorMessage,
    flushInterim,
  };
}
