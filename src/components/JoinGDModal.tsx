'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Users, ArrowRight, Loader2, KeyRound } from 'lucide-react';

interface JoinGDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGDModal({ isOpen, onClose }: JoinGDModalProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanCode = roomCode.trim().toUpperCase();

    // If user pasted full URL (e.g. https://.../human-gd/join/IGD-XXXXX)
    if (cleanCode.includes('/JOIN/')) {
      cleanCode = cleanCode.split('/JOIN/')[1].split('?')[0].split('/')[0];
    } else if (cleanCode.includes('/ROOM/')) {
      const sessId = cleanCode.split('/ROOM/')[1].split('?')[0].split('/')[0];
      router.push(`/human-gd/room/${sessId}`);
      onClose();
      return;
    }

    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gd/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Room not found. Please check your room code.');
      }

      onClose();
      router.push(`/human-gd/room/${data.session.id}`);
    } catch (err: any) {
      setError(err.message || 'Unable to join discussion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            Participant Join
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Join Discussion Room
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the unique 5-character room code shared by your host.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Room Code or Join Link
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. IGD-7K42P"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-400 font-mono font-bold tracking-widest text-center text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !roomCode.trim()}
            className="w-full py-3.5 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-2xl shadow-lg shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Room...
              </>
            ) : (
              <>
                Enter Discussion Room <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
