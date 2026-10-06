'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebRTCAudioProps {
  sessionId: string;
  userId: string;
  isMuted: boolean;
  onSendSignal: (payload: { type: string; senderId: string; targetId?: string; data: any }) => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTCAudio({ sessionId, userId, isMuted, onSendSignal }: UseWebRTCAudioProps) {
  const [hasMicrophone, setHasMicrophone] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Acquire local microphone stream
  useEffect(() => {
    let mounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setHasMicrophone(true);
        setAudioError(null);

        // Update track enabled state based on isMuted
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
      } catch (err: any) {
        console.warn('WebRTC audio acquisition note:', err);
        setAudioError('Microphone not available or permission denied.');
        setHasMicrophone(false);
      }
    }

    initAudio();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      // Close peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      // Remove audio elements
      remoteAudiosRef.current.forEach(audio => {
        audio.pause();
        audio.remove();
      });
      remoteAudiosRef.current.clear();
    };
  }, [sessionId]);

  // Update track enabled on mute toggle
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Create or retrieve peer connection for a remote participant
  const getOrCreatePeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSendSignal({
          type: 'ICE_CANDIDATE',
          senderId: userId,
          targetId: remoteUserId,
          data: event.candidate,
        });
      }
    };

    // Remote audio track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudiosRef.current.get(remoteUserId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.id = `remote-audio-${remoteUserId}`;
          document.body.appendChild(audioEl);
          remoteAudiosRef.current.set(remoteUserId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(e => console.log('Audio autoplay prevented:', e));
      }
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [userId, onSendSignal]);

  // Handle incoming signaling messages
  const handleSignal = useCallback(async (signal: { type: string; senderId: string; targetId?: string; data: any }) => {
    if (signal.senderId === userId) return; // Ignore self
    if (signal.targetId && signal.targetId !== userId) return; // Not for this peer

    const remoteUserId = signal.senderId;

    try {
      if (signal.type === 'PEER_JOINED') {
        // As an existing peer, initiate WebRTC offer to new peer
        const pc = getOrCreatePeerConnection(remoteUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        onSendSignal({
          type: 'OFFER',
          senderId: userId,
          targetId: remoteUserId,
          data: offer,
        });
      } else if (signal.type === 'OFFER') {
        const pc = getOrCreatePeerConnection(remoteUserId);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        onSendSignal({
          type: 'ANSWER',
          senderId: userId,
          targetId: remoteUserId,
          data: answer,
        });
      } else if (signal.type === 'ANSWER') {
        const pc = peerConnectionsRef.current.get(remoteUserId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        }
      } else if (signal.type === 'ICE_CANDIDATE') {
        const pc = peerConnectionsRef.current.get(remoteUserId);
        if (pc && signal.data) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        }
      }
    } catch (err) {
      console.warn('WebRTC signal processing note:', err);
    }
  }, [userId, getOrCreatePeerConnection, onSendSignal]);

  return {
    hasMicrophone,
    audioError,
    handleSignal,
  };
}
