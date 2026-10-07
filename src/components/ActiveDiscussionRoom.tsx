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
  AlertCircle,
  Send,
  MessageSquare,
  CornerDownLeft,
  CheckCircle2,
  FastForward,
  UserCheck,
  Volume2
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
  onTurnChange?: (currentSpeakerId: string, turnNumber: number) => void;
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
  onTurnChange,
  onEndDiscussion,
  onSendWebRTCSignal,
  onBroadcastSpeakerState,
}: ActiveDiscussionRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showTopicPrep, setShowTopicPrep] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  
  // Dual-mode text input state
  const [typedMessage, setTypedMessage] = useState('');
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isPassingTurn, setIsPassingTurn] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current active turn speaker
  const currentSpeakerId = session.current_speaker_id || (participants[0]?.user_id) || currentUser.id;
  const currentTurnNumber = session.current_turn_number || 1;
  const currentSpeaker = participants.find(p => p.user_id === currentSpeakerId) || participants[0] || {
    id: currentSpeakerId,
    session_id: session.id,
    user_id: currentSpeakerId,
    participant_name: currentUser.name,
    is_host: isHost,
    joined_at: new Date().toISOString(),
    status: 'JOINED' as const,
  };
  const isMyTurn = currentSpeakerId === currentUser.id;

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
          turnNumber: currentTurnNumber,
          mode: 'speech',
          startTimeOffsetMs: startMs,
          endTimeOffsetMs: endMs,
        }),
      });

      const data = await res.json();
      if (data.success && data.transcript) {
        onNewTranscript(data.transcript);
        if (data.nextSpeaker && onTurnChange) {
          onTurnChange(data.nextSpeaker.user_id, data.nextTurnNumber);
        }
      }
    } catch (err) {
      console.error('Error saving speech transcript:', err);
    }
  };

  const { micStatus, interimText, audioLevel, isSpeaking, errorMessage, flushInterim } = useSpeechRecognition({
    enabled: !isMuted && session.status === 'ACTIVE',
    onFinalTranscript: handleFinalSpeechTranscript,
  });

  // Handle Typed Text Contribution & Advance Turn
  const handleSendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = typedMessage.trim();
    if (!cleanText || isSubmittingText) return;

    setIsSubmittingText(true);
    setTypedMessage('');

    try {
      const now = Date.now();
      const res = await fetch('/api/gd/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          text: cleanText,
          turnNumber: currentTurnNumber,
          mode: 'text',
          startTimeOffsetMs: now - 3000,
          endTimeOffsetMs: now,
        }),
      });

      const data = await res.json();
      if (data.success && data.transcript) {
        onNewTranscript(data.transcript);
        if (data.nextSpeaker && onTurnChange) {
          onTurnChange(data.nextSpeaker.user_id, data.nextTurnNumber);
        }
      }
    } catch (err) {
      console.error('Error sending text message to discussion:', err);
    } finally {
      setIsSubmittingText(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Pass Turn to Next Participant
  const handlePassTurn = async () => {
    if (isPassingTurn) return;
    setIsPassingTurn(true);

    // If there is spoken text in buffer, flush it first
    if (interimText.trim().length > 0) {
      flushInterim();
    }

    try {
      const res = await fetch('/api/gd/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          targetUserId: currentSpeakerId,
        }),
      });

      const data = await res.json();
      if (data.success && data.nextSpeaker && onTurnChange) {
        onTurnChange(data.nextSpeaker.user_id, data.turnNumber);
      }
    } catch (err) {
      console.error('Error passing turn:', err);
    } finally {
      setIsPassingTurn(false);
    }
  };

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
            🎤 Voice-to-Text Active
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-medium text-xs">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            🎙 Mic Ready
          </span>
        );
      case 'MUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">
            <MicOff className="w-3.5 h-3.5" />
            🔇 Mic Muted
          </span>
        );
      case 'PERMISSION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ⚠ Mic Permission Required
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            💬 Text Mode Active
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-5rem)] max-h-[920px] animate-in fade-in duration-300">
      
      {/* 1. Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        
        {/* Topic Title & Badges */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE HUMAN GD
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Room: {session.room_code}
              </span>
              <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 flex items-center gap-1">
                <Users className="w-3 h-3" /> {participants.length} Participant{participants.length === 1 ? '' : 's'}
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

      {/* 2. Active Turn Status Banner (AI-Mode Style) */}
      <div className={`p-3 rounded-2xl mb-3 border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md transition-all ${
        isMyTurn
          ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-950 border-emerald-500/50'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
            isMyTurn 
              ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20' 
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}>
            {isMyTurn ? <Mic className="w-5 h-5 animate-pulse" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${isMyTurn ? 'text-emerald-400' : 'text-slate-300'}`}>
                {isMyTurn ? 'Your Turn to Speak' : `Current Speaker: ${currentSpeaker.participant_name}`}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Turn #{currentTurnNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isMyTurn 
                ? 'Speak into your microphone or type your argument below, then complete your turn.' 
                : `Waiting for ${currentSpeaker.participant_name} to present their point...`}
            </p>
          </div>
        </div>

        {/* Turn Actions */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <button
              onClick={handlePassTurn}
              disabled={isPassingTurn}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPassingTurn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FastForward className="w-3.5 h-3.5" />}
              <span>Pass Turn</span>
            </button>
          ) : isHost ? (
            <button
              onClick={handlePassTurn}
              disabled={isPassingTurn}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Skip to next speaker if participant is unresponsive"
            >
              {isPassingTurn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FastForward className="w-3.5 h-3.5" />}
              <span>Host: Next Speaker</span>
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium flex items-center gap-2.5 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Main Discussion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        
        {/* Left: Participant Roster & Live Speaker States */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Participants ({participants.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Cycle Flow</span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {participants.map((p, idx) => {
              const isMe = p.user_id === currentUser.id;
              const isTurnSpeaker = p.user_id === currentSpeakerId;
              const speakerState = isMe 
                ? { isSpeaking, volume: audioLevel, isMuted } 
                : activeSpeakers[p.user_id] || { isSpeaking: false, volume: 0, isMuted: false };

              return (
                <div
                  key={p.user_id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isTurnSpeaker
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="relative">
                      <img
                        src={p.participant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`}
                        alt={p.participant_name}
                        className={`w-8 h-8 rounded-lg object-cover transition-all ${
                          isTurnSpeaker 
                            ? 'ring-2 ring-emerald-400 scale-105' 
                            : 'ring-1 ring-slate-700'
                        }`}
                      />
                      {isTurnSpeaker && (
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
                        {isTurnSpeaker ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Mic className="w-3 h-3 animate-pulse" />
                            Active Speaker
                          </span>
                        ) : speakerState.isSpeaking ? (
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            Audio Active
                          </span>
                        ) : (
                          <span className="text-slate-400">Waiting Turn</span>
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
              <span>Your Microphone Level</span>
              <span className="font-mono">{isMuted ? 'Muted' : `${audioLevel}%`}</span>
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

        {/* Center/Right: Live Shared Conversation Feed (AI-Mode Flow) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Shared Discussion Conversation ({transcripts.length} Turns)
              </h3>
            </div>
            
            {/* Clear Mode Pill */}
            <div>
              {renderMicBadge(micStatus)}
            </div>
          </div>

          {/* Conversation Feed Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 min-h-0">
            {transcripts.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                  <Mic className="w-6 h-6 text-emerald-400/80" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  Discussion Active — {isMyTurn ? 'Your Turn to Open the GD' : `Waiting for ${currentSpeaker.participant_name} to Open`}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  The discussion moves cyclically from one participant to the next. When it is your turn, speak into your microphone or type your argument below!
                </p>
              </div>
            )}

            {transcripts.map((t, idx) => {
              const isMe = t.user_id === currentUser.id;
              const formattedTime = new Date(t.timestamp || t.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });
              const textContent = t.text || t.transcript || '';
              const turnNum = t.turn_number || idx + 1;

              return (
                <div
                  key={t.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-emerald-950/25 border-emerald-500/40 ml-4 sm:ml-10 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 mr-4 sm:mr-10 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        isMe ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {t.participant_name ? t.participant_name.slice(0, 2).toUpperCase() : 'GD'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isMe ? 'text-emerald-400' : 'text-cyan-400'}`}>
                            {t.participant_name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        Turn #{turnNum}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal pl-9">
                    {textContent}
                  </p>
                </div>
              );
            })}

            {/* Live Interim Speech Bubble */}
            {interimText && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-dashed border-emerald-500/50 ml-4 sm:ml-10 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">
                      {currentUser.name} (Speaking Turn #{currentTurnNumber}...)
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <button
                    onClick={flushInterim}
                    className="px-3 py-1 text-[11px] font-bold bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Commit Turn & Pass
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200 italic leading-relaxed pl-2">
                  "{interimText}"
                </p>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* 4. Dual-Mode Conversation Input & Turn Control Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 shrink-0">
            
            {/* Interactive Text Conversation Input Box */}
            <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={
                    isMyTurn 
                      ? "🎤 Speak into your mic OR type your point and press Enter to complete turn..." 
                      : `Waiting for ${currentSpeaker.participant_name}... (You can prepare your message)`
                  }
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all pr-10 ${
                    isMyTurn 
                      ? 'border-emerald-500/80 focus:ring-1 focus:ring-emerald-400' 
                      : 'border-slate-800 focus:border-slate-700'
                  }`}
                />
                {typedMessage.trim().length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-mono hidden sm:inline">
                    Enter ↵
                  </span>
                )}
              </div>

              {/* Send & Pass Turn Button */}
              <button
                type="submit"
                disabled={!typedMessage.trim() || isSubmittingText}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isSubmittingText ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Turn</span>
                  </>
                )}
              </button>

              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all shrink-0 ${
                  isMuted
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400'
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Cyclical Turn Flow: All spoken and typed statements are recorded in sequence for Post-GD AI evaluation.
              </span>
              <span className="hidden sm:inline font-mono">
                {isMyTurn ? '🟢 Your Active Turn' : `⏳ Turn: ${currentSpeaker.participant_name}`}
              </span>
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
