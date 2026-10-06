'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Users, ShieldCheck, Loader2, AlertTriangle, Key } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';
  const { user, loading, isSupabaseConfigured, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [user, loading, router, next]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google login.');
      setSigningIn(false);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Logo & Title */}
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
          <Users className="w-7 h-7 text-slate-950 font-bold" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Supabase Google OAuth
        </div>
        <h1 className="text-2xl font-black text-white">
          Sign In to Intelli<span className="text-emerald-400">GD</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
          Access your human group discussions, real-time speech transcription, and post-GD AI performance scorecards.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Supabase Setup Required</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            To sign in with Google, add your real Supabase Project credentials to <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">.env.local</code>:
          </p>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1 overflow-x-auto">
            <div>NEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-left">
          {error}
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={signingIn || loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {signingIn ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400">
        Pure Human Group Discussion • No AI Debater Agents
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-slate-400 flex items-center gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading login...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
