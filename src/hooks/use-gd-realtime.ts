'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GDSession, Participant, TranscriptItem } from '@/types';

interface UseGDRealtimeProps {
  sessionId: string;
  currentUser: { id: string; name: string; avatar_url?: string };
  initialSession: GDSession;
  initialParticipants: Participant[];
  initialTranscripts: TranscriptItem[];
  onWebRTCSignal?: (signal: any) => void;
}

export function useGDRealtime({
  sessionId,
  currentUser,
  initialSession,
  initialParticipants,
  initialTranscripts,
  onWebRTCSignal,
}: UseGDRealtimeProps) {
  const [session, setSession] = useState<GDSession>(initialSession);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>(initialTranscripts);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('CONNECTED');
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, { isSpeaking: boolean; volume: number; isMuted: boolean }>>({});

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const supabaseChannelRef = useRef<any>(null);
  const onWebRTCSignalRef = useRef(onWebRTCSignal);

  useEffect(() => {
    onWebRTCSignalRef.current = onWebRTCSignal;
  }, [onWebRTCSignal]);

  // Sync state from server API periodically or on reconnect
  const refreshSessionState = useCallback(async () => {
    try {
      const res = await fetch(`/api/gd/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSession(data.session);
        if (data.participants) setParticipants(data.participants);
        if (data.transcripts) setTranscripts(data.transcripts);
      }
    } catch (err) {
      console.warn('Refresh state failed:', err);
    }
  }, [sessionId]);

  // Setup Realtime connections
  useEffect(() => {
    let mounted = true;
    setConnectionStatus('CONNECTED');

    // 1. Browser BroadcastChannel for instant local multi-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(`intelligd_room_${sessionId}`);
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          if (!mounted) return;
          const { type, payload } = event.data || {};

          if (type === 'HOST_STARTED_GD') {
            setSession(prev => ({
              ...prev,
              status: 'ACTIVE',
              started_at: payload.started_at || new Date().toISOString(),
              gd_deadline: payload.gd_deadline || null,
            }));
          } else if (type === 'HOST_ENDED_GD') {
            setSession(prev => ({
              ...prev,
              status: 'COMPLETED',
              ended_at: payload.ended_at || new Date().toISOString(),
            }));
          } else if (type === 'PARTICIPANT_JOINED') {
            setParticipants(prev => {
              if (prev.some(p => p.user_id === payload.user_id)) return prev;
              return [...prev, payload];
            });
          } else if (type === 'NEW_TRANSCRIPT') {
            setTranscripts(prev => {
              if (prev.some(t => t.id === payload.id)) return prev;
              return [...prev, payload];
            });
          } else if (type === 'SPEAKER_STATE') {
            setActiveSpeakers(prev => ({
              ...prev,
              [payload.userId]: {
                isSpeaking: payload.isSpeaking,
                volume: payload.volume,
                isMuted: payload.isMuted,
              },
            }));
          } else if (type === 'WEBRTC_SIGNAL') {
            if (onWebRTCSignalRef.current) {
              onWebRTCSignalRef.current(payload);
            }
          }
        };
      }
    } catch (bcErr) {
      console.warn('BroadcastChannel initialization note:', bcErr);
    }

    // 2. Supabase Realtime Channel for multi-device/multi-network sync
    const supabase = createClient();
    const channel = supabase.channel(`gd_room_${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUser.id },
      },
    });

    supabaseChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'HOST_STARTED_GD' }, ({ payload }) => {
        if (!mounted) return;
        setSession(prev => ({
          ...prev,
          status: 'ACTIVE',
          started_at: payload.started_at,
          gd_deadline: payload.gd_deadline,
        }));
      })
      .on('broadcast', { event: 'HOST_ENDED_GD' }, ({ payload }) => {
        if (!mounted) return;
        setSession(prev => ({
          ...prev,
          status: 'COMPLETED',
          ended_at: payload.ended_at,
        }));
      })
      .on('broadcast', { event: 'PARTICIPANT_JOINED' }, ({ payload }) => {
        if (!mounted) return;
        setParticipants(prev => {
          if (prev.some(p => p.user_id === payload.user_id)) return prev;
          return [...prev, payload];
        });
      })
      .on('broadcast', { event: 'NEW_TRANSCRIPT' }, ({ payload }) => {
        if (!mounted) return;
        setTranscripts(prev => {
          if (prev.some(t => t.id === payload.id)) return prev;
          return [...prev, payload];
        });
      })
      .on('broadcast', { event: 'SPEAKER_STATE' }, ({ payload }) => {
        if (!mounted) return;
        setActiveSpeakers(prev => ({
          ...prev,
          [payload.userId]: {
            isSpeaking: payload.isSpeaking,
            volume: payload.volume,
            isMuted: payload.isMuted,
          },
        }));
      })
      .on('broadcast', { event: 'WEBRTC_SIGNAL' }, ({ payload }) => {
        if (!mounted) return;
        if (onWebRTCSignalRef.current) {
          onWebRTCSignalRef.current(payload);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        // Presence state updated
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
          // Announce peer joined to audio mesh
          channel.send({
            type: 'broadcast',
            event: 'WEBRTC_SIGNAL',
            payload: { type: 'PEER_JOINED', senderId: currentUser.id },
          }).catch(() => {});
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('RECONNECTING');
        }
      });

    // Notify peers that current participant has joined
    const participantPayload: Participant = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      user_id: currentUser.id,
      participant_name: currentUser.name,
      participant_avatar: currentUser.avatar_url || null,
      is_host: initialSession.host_id === currentUser.id,
      joined_at: new Date().toISOString(),
      status: 'JOINED',
    };

    if (bc) {
      bc.postMessage({ type: 'PARTICIPANT_JOINED', payload: participantPayload });
    }

    // Refresh state periodically (every 5 seconds as a safety net)
    const pollInterval = setInterval(refreshSessionState, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      if (bc) {
        bc.close();
      }
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUser.id, currentUser.name, currentUser.avatar_url, initialSession.host_id, refreshSessionState]);

  // Methods to broadcast events to peers
  const broadcastHostStarted = useCallback((startedSession: GDSession) => {
    setSession(startedSession);
    const payload = {
      started_at: startedSession.started_at,
      gd_deadline: startedSession.gd_deadline,
    };
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'HOST_STARTED_GD', payload });
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'HOST_STARTED_GD',
        payload,
      }).catch(() => {});
    }
  }, []);

  const broadcastHostEnded = useCallback((endedSession: GDSession) => {
    setSession(endedSession);
    const payload = { ended_at: endedSession.ended_at };
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'HOST_ENDED_GD', payload });
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'HOST_ENDED_GD',
        payload,
      }).catch(() => {});
    }
  }, []);

  const broadcastNewTranscript = useCallback((transcriptItem: TranscriptItem) => {
    setTranscripts(prev => [...prev, transcriptItem]);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'NEW_TRANSCRIPT', payload: transcriptItem });
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'NEW_TRANSCRIPT',
        payload: transcriptItem,
      }).catch(() => {});
    }
  }, []);

  const broadcastSpeakerState = useCallback((isSpeaking: boolean, volume: number, isMuted: boolean) => {
    const payload = { userId: currentUser.id, isSpeaking, volume, isMuted };
    setActiveSpeakers(prev => ({
      ...prev,
      [currentUser.id]: { isSpeaking, volume, isMuted },
    }));
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'SPEAKER_STATE', payload });
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'SPEAKER_STATE',
        payload,
      }).catch(() => {});
    }
  }, [currentUser.id]);

  const sendWebRTCSignal = useCallback((signal: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'WEBRTC_SIGNAL', payload: signal });
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'WEBRTC_SIGNAL',
        payload: signal,
      }).catch(() => {});
    }
  }, []);

  return {
    session,
    participants,
    transcripts,
    connectionStatus,
    activeSpeakers,
    broadcastHostStarted,
    broadcastHostEnded,
    broadcastNewTranscript,
    broadcastSpeakerState,
    sendWebRTCSignal,
    refreshSessionState,
  };
}
