'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GDSession, Participant, TranscriptItem } from '@/types';
import { useSpeechRecognition, MicStatus } from '@/hooks/use-speech-recognition';
import { useWebRTCAudio } from '@/hooks/use-webrtc-audio';
import { 
  Mic, 
  MicOff, 
  StopCircle, 
  Clock, 
  Sparkles, 
  Radio, 
  Users, 
  BookOpen, 
  AlertTriangle,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TopicPrepDrawer } from './TopicPrepDrawer';

interface ActiveDiscussionRoomProps {
  session: GDSession;
  participants: Participant[];
  transcripts: TranscriptItem[];
  currentUser: { id: string; name: string; avatar_url?: string };
  isHost: boolean;
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  activeSpeakers: Record<string, { isSpeaking: boolean; volume: number; isMuted: boolean }>;
  onNewTranscript: (transcript: TranscriptItem) => void;
  onEndDiscussion: () => Promise<void>;
  onSendWebRTCSignal: (signal: any) => void;
  onBroadcastSpeakerState: (isSpeaking: boolean, volume: number, isMuted: boolean) => void;
}

export function ActiveDiscussionRoom({
  session,
  participants,
  transcripts,
  currentUser,
  isHost,
  connectionStatus,
  activeSpeakers,
  onNewTranscript,
  onEndDiscussion,
  onSendWebRTCSignal,
  onBroadcastSpeakerState,
}: ActiveDiscussionRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showTopicPrep, setShowTopicPrep] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Shared server-controlled timer
  useEffect(() => {
    if (!session.gd_deadline) return;

    const calculateRemaining = () => {
      const deadlineMs = new Date(session.gd_deadline!).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
      setRemainingSeconds(diffSecs);

      // Auto-end if timer reaches 0
      if (diffSecs <= 0 && isHost && !isEnding) {
        setIsEnding(true);
        onEndDiscussion().catch(() => {});
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [session.gd_deadline, isHost, isEnding, onEndDiscussion]);

  // Speech Recognition Hook for Local Speech-to-Text
  const handleFinalSpeechTranscript = async (text: string, startMs: number, endMs: number) => {
    if (!text || text.trim().length === 0) return;

    try {
      const res = await fetch('/api/gd/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          text: text.trim(),
          startTimeOffsetMs: startMs,
          endTimeOffsetMs: endMs,
        }),
      });

      const data = await res.json();
      if (data.success && data.transcript) {
        onNewTranscript(data.transcript);
      }
    } catch (err) {
      console.error('Error saving speech transcript:', err);
    }
  };

  const { micStatus, interimText, audioLevel, isSpeaking, errorMessage } = useSpeechRecognition({
    enabled: !isMuted && session.status === 'ACTIVE',
    onFinalTranscript: handleFinalSpeechTranscript,
  });

  // WebRTC Audio Mesh Hook
  const { hasMicrophone, audioError, handleSignal } = useWebRTCAudio({
    sessionId: session.id,
    userId: currentUser.id,
    isMuted,
    onSendSignal: onSendWebRTCSignal,
  });

  // Broadcast speaking volume level to peers
  useEffect(() => {
    onBroadcastSpeakerState(isSpeaking, audioLevel, isMuted);
  }, [isSpeaking, audioLevel, isMuted, onBroadcastSpeakerState]);

  // Auto-scroll transcript feed
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimText]);

  const handleEnd = async () => {
    if (!isHost) return;
    const confirm = window.confirm('Are you sure you want to end the group discussion? Post-discussion AI will analyze all participant contributions individually.');
    if (!confirm) return;

    setIsEnding(true);
    try {
      await onEndDiscussion();
    } catch (err: any) {
      console.error('Failed to end discussion:', err);
      setIsEnding(false);
    }
  };

  // Format timer
  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '--:--';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMicBadge = (status: MicStatus) => {
    switch (status) {
      case 'LISTENING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs animate-pulse">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            🎤 Listening
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-medium text-xs">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            🎙 Microphone Ready
          </span>
        );
      case 'MUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">
            <MicOff className="w-3.5 h-3.5" />
            🔇 Muted
          </span>
        );
      case 'PERMISSION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ⚠ Microphone Permission Required
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ❌ Microphone Unavailable
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-5rem)] max-h-[920px] animate-in fade-in duration-300">
      
      {/* 1. Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        
        {/* Topic Title & Badges */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Live GD
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Room: {session.room_code}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xl">
              {session.topic}
            </h1>
          </div>
        </div>

        {/* Right Status / Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Server-Controlled Countdown Timer */}
          {remainingSeconds !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs ${
              remainingSeconds < 120 
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse' 
                : 'bg-slate-950 border-slate-800 text-emerald-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'CONNECTED' ? 'bg-emerald-400' :
              connectionStatus === 'RECONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
            }`} />
            <span className="hidden sm:inline">
              {connectionStatus === 'CONNECTED' ? 'Connected' :
               connectionStatus === 'RECONNECTING' ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>

          {/* AI Prep Helper Toggle */}
          {session.topic_materials && (
            <button
              onClick={() => setShowTopicPrep(true)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
              title="Open Topic Prep Kit"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Host End Discussion Button */}
          {isHost ? (
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isEnding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Ending & Analyzing...
                </>
              ) : (
                <>
                  <StopCircle className="w-3.5 h-3.5" />
                  End Discussion
                </>
              )}
            </button>
          ) : (
            <div className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              Host controls discussion end
            </div>
          )}

        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium flex items-center gap-2.5 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Discussion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        
        {/* Left: Participant Roster & Live Speaker States */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Participants ({participants.length})
            </h3>
            <span className="text-[10px] text-slate-400">Live Voice</span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {participants.map((p) => {
              const isMe = p.user_id === currentUser.id;
              const speakerState = isMe 
                ? { isSpeaking, volume: audioLevel, isMuted } 
                : activeSpeakers[p.user_id] || { isSpeaking: false, volume: 0, isMuted: false };

              return (
                <div
                  key={p.user_id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    speakerState.isSpeaking
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="relative">
                      <img
                        src={p.participant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`}
                        alt={p.participant_name}
                        className={`w-8 h-8 rounded-lg object-cover transition-all ${
                          speakerState.isSpeaking 
                            ? 'ring-2 ring-emerald-400 scale-105' 
                            : 'ring-1 ring-slate-700'
                        }`}
                      />
                      {speakerState.isSpeaking && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {p.participant_name}
                        {isMe && <span className="text-[9px] text-emerald-400 font-normal">(You)</span>}
                      </div>
                      <div className="text-[10px] flex items-center gap-1 font-medium">
                        {speakerState.isSpeaking ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Speaking
                          </span>
                        ) : speakerState.isMuted ? (
                          <span className="text-slate-400 flex items-center gap-1">
                            <MicOff className="w-2.5 h-2.5" /> Muted
                          </span>
                        ) : (
                          <span className="text-slate-400">Listening</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {p.is_host && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        HOST
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Local Micro-Volume Meter */}
          <div className="mt-3 pt-3 border-t border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Your Microphone</span>
              <span className="font-mono">{isMuted ? 'Muted' : `${audioLevel}% Level`}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  isMuted ? 'bg-slate-700 w-0' : audioLevel > 50 ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${isMuted ? 0 : audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center/Right: Live Synced Transcript Feed */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Live Discussion Transcripts ({transcripts.length})
              </h3>
            </div>
            
            {/* Clear Microphone State Pill */}
            <div>
              {renderMicBadge(micStatus)}
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
            {transcripts.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                  <Mic className="w-6 h-6 text-emerald-400/80" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  Discussion is Active — Start Speaking
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Unmute your microphone and speak. Speech is captured on your device and synchronized in real time tagged with your verified participant name.
                </p>
              </div>
            )}

            {transcripts.map((t) => {
              const isMe = t.user_id === currentUser.id;
              const formattedTime = new Date(t.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-emerald-950/20 border-emerald-500/30 ml-4 sm:ml-12'
                      : 'bg-slate-950/70 border-slate-800/90 mr-4 sm:mr-12'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isMe ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {t.participant_name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.2 rounded font-normal">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {t.text}
                  </p>
                </div>
              );
            })}

            {/* Live Interim Speech Bubble */}
            {interimText && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-dashed border-emerald-500/40 ml-4 sm:ml-12 animate-pulse">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-400">
                    {currentUser.name} (Speaking now...)
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-xs sm:text-sm text-emerald-200 italic leading-relaxed">
                  "{interimText}"
                </p>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* 3. Bottom Microphone Controls */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  isMuted
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Unmute Microphone
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Mute Microphone
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {isMuted ? 'Your microphone is muted' : 'Speaking automatically transcribes under your identity'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live Voice Mesh
            </div>
          </div>
        </div>

      </div>

      {/* AI Topic Prep Drawer */}
      {session.topic_materials && (
        <TopicPrepDrawer
          isOpen={showTopicPrep}
          onClose={() => setShowTopicPrep(false)}
          topic={session.topic}
          material={session.topic_materials}
        />
      )}
    </div>
  );
}
