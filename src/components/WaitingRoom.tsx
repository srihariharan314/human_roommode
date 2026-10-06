'use client';

import React, { useState } from 'react';
import { GDSession, Participant } from '@/types';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Play, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Radio, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { TopicPrepDrawer } from './TopicPrepDrawer';

interface WaitingRoomProps {
  session: GDSession;
  participants: Participant[];
  currentUser: { id: string; name: string; avatar_url?: string };
  isHost: boolean;
  onStartDiscussion: () => Promise<void>;
}

export function WaitingRoom({
  session,
  participants,
  currentUser,
  isHost,
  onStartDiscussion,
}: WaitingRoomProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showTopicPrep, setShowTopicPrep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate production join link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://intelligd.app';
  const joinUrl = `${origin}/human-gd/join/${session.room_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.room_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = `You're invited to join an IntelliGD Group Discussion.\n\nTopic: ${session.topic}\n\nRoom Code: ${session.room_code}\n\nJoin here:\n${joinUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleStart = async () => {
    if (!isHost) return;
    setIsStarting(true);
    setError(null);
    try {
      await onStartDiscussion();
    } catch (err: any) {
      console.error('Failed to start discussion:', err);
      setError(err.message || 'Failed to start discussion.');
      setIsStarting(false);
    }
  };

  const hostParticipant = participants.find(p => p.is_host) || {
    participant_name: 'Host User',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      
      {/* Session Header Card */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Waiting Room
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {Math.round(session.duration_seconds / 60)} min discussion
              </span>
              {isHost ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  You are the Host
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  Participant Mode
                </span>
              )}
            </div>

            {/* Topic Title */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Discussion Topic
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {session.topic}
              </h1>
            </div>

            {/* Host info */}
            <p className="text-xs text-slate-400">
              Host: <strong className="text-slate-200">{hostParticipant.participant_name}</strong> • Max Participants: <strong className="text-slate-200">{session.max_participants}</strong>
            </p>
          </div>

          {/* Topic Prep Kit Button */}
          {session.topic_materials && (
            <button
              onClick={() => setShowTopicPrep(true)}
              className="px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 rounded-2xl transition-all text-left flex items-center gap-3 shrink-0 shadow-lg group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  AI Prep Kit <Sparkles className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  Read arguments & examples
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Room Code & WhatsApp Sharing Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Room Code */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Room Code
              </span>
              <span className="text-lg font-mono font-black text-emerald-400 tracking-wider">
                {session.room_code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Copy Join Link */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Production Join Link
              </span>
              <span className="text-xs text-slate-300 font-mono truncate block">
                {joinUrl}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors shrink-0"
              title="Copy Join Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="p-3.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>

        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Participants Grid & Waiting Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Participants List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Connected Participants ({participants.length}/{session.max_participants})
            </h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Real-time Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {participants.map((p) => {
              const isMe = p.user_id === currentUser.id;
              return (
                <div
                  key={p.user_id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={p.participant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`}
                        alt={p.participant_name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {p.participant_name}
                        {isMe && <span className="text-[10px] text-emerald-400 font-normal">(You)</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.is_host ? 'Host Organizer' : 'Participant'}
                      </div>
                    </div>
                  </div>

                  {p.is_host && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300">
                      HOST
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {participants.length === 1 && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Waiting for participants to join using the room code <strong className="text-emerald-400">{session.room_code}</strong> or join link.
              </p>
            </div>
          )}
        </div>

        {/* Action Panel / Waiting Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">
              Discussion Status
            </h3>
            
            {isHost ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Ready to Launch
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As the host, you decide when everyone begins. When you click <strong>START DISCUSSION</strong>, all participants across all connected devices will immediately enter the live room together.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Waiting for Host
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Waiting for <strong>{hostParticipant.participant_name}</strong> to start the discussion. You will be automatically redirected to the active room the moment the host begins.
                </p>
              </div>
            )}
          </div>

          {/* Host Controls */}
          {isHost ? (
            <div>
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full py-4 px-6 text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Discussion...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" />
                    START DISCUSSION
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                All connected devices will transition instantly.
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Listening for Host Start Signal...
              </div>
            </div>
          )}

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
