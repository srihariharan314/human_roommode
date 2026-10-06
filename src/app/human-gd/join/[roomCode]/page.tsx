'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, AlertCircle, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';

export default function JoinByRoomCodePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const roomCode = params.roomCode as string;

  useEffect(() => {
    async function joinRoom() {
      if (authLoading) return;

      if (!user) {
        setIsJoining(false);
        setShowAuthModal(true);
        return;
      }

      try {
        const res = await fetch('/api/gd/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to join session.');
        }

        // Redirect into the ONE existing session room
        router.replace(`/human-gd/room/${data.session.id}`);
      } catch (err: any) {
        console.error('Error in join page:', err);
        setError(err.message || 'This GD room does not exist or has ended.');
        setIsJoining(false);
      }
    }

    joinRoom();
  }, [roomCode, user, authLoading, router]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        {isJoining ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Connecting to Room {roomCode?.toUpperCase()}...
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Validating session and adding you to the participant roster.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Unable to Join Discussion
              </h2>
              <p className="text-xs text-rose-300 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Sign In Required
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please sign in with Google or select your participant profile to join room {roomCode}.
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Sign In to Continue
            </button>
          </div>
        )}

      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
