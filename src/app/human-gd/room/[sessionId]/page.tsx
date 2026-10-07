'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { GDSession, Participant, TranscriptItem, GDResult, GDFeedback, ParticipantScoreOverview } from '@/types';
import { useGDRealtime } from '@/hooks/use-gd-realtime';
import { WaitingRoom } from '@/components/WaitingRoom';
import { ActiveDiscussionRoom } from '@/components/ActiveDiscussionRoom';
import { ScorecardView } from '@/components/ScorecardView';
import { Loader2, AlertCircle, Sparkles, RotateCcw, ShieldCheck, FileText } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';

export default function GDRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<GDSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Analysis states
  const [analysisResult, setAnalysisResult] = useState<GDResult | null>(null);
  const [analysisFeedback, setAnalysisFeedback] = useState<GDFeedback | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allParticipantsOverview, setAllParticipantsOverview] = useState<ParticipantScoreOverview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load initial session
  useEffect(() => {
    async function loadSession() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        setShowAuthModal(true);
        return;
      }

      try {
        const res = await fetch(`/api/gd/session/${sessionId}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Session not found.');
        }

        setSession(data.session);
        setParticipants(data.participants || []);
        setTranscripts(data.transcripts || []);
        setSelectedUserId(user.id);

        // Also ensure user is registered as participant in database
        fetch('/api/gd/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});

        // If completed, fetch or trigger AI analysis
        if (data.session.status === 'COMPLETED') {
          fetchAnalysis(data.session.id, user.id);
        }
      } catch (err: any) {
        console.error('Error loading session:', err);
        setError(err.message || 'Unable to load GD session.');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId, user, authLoading]);

  // Fetch AI scorecard when discussion is COMPLETED
  const fetchAnalysis = useCallback(async (sessId: string, targetUid?: string) => {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    const uid = targetUid || selectedUserId || user.id;

    try {
      // 1. Fetch individual scorecard for current target user
      const res = await fetch('/api/gd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessId, targetUserId: uid }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Analysis generation failed.');
      }

      if (data.result && data.feedback) {
        setAnalysisResult(data.result);
        setAnalysisFeedback(data.feedback);
      }

      // 2. If host, also fetch full session overview for leaderboard
      const isHostUser = session?.host_id === user.id;
      if (isHostUser) {
        try {
          const overviewRes = await fetch('/api/gd/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessId, fetchAll: true }),
          });
          const overviewData = await overviewRes.json();
          if (overviewData.success && Array.isArray(overviewData.overview)) {
            setAllParticipantsOverview(overviewData.overview);
          }
        } catch (overviewErr) {
          console.warn('Overview fetch note:', overviewErr);
        }
      }
    } catch (err: any) {
      console.error('Error fetching AI analysis:', err);
      setAnalysisError(err.message || 'AI analysis temporarily unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, selectedUserId, session?.host_id]);

  // Multi-device Realtime Sync Hook
  const {
    session: realtimeSession,
    participants: realtimeParticipants,
    transcripts: realtimeTranscripts,
    connectionStatus,
    activeSpeakers,
    broadcastHostStarted,
    broadcastHostEnded,
    broadcastNewTranscript,
    broadcastTurnChange,
    broadcastSpeakerState,
    sendWebRTCSignal,
  } = useGDRealtime({
    sessionId: session?.id || sessionId,
    currentUser: user || { id: 'temp-user', name: 'User' },
    initialSession: session || {
      id: sessionId,
      host_id: '',
      room_code: '',
      topic: '',
      status: 'WAITING',
      max_participants: 10,
      duration_seconds: 900,
      created_at: new Date().toISOString(),
    },
    initialParticipants: participants,
    initialTranscripts: transcripts,
    onWebRTCSignal: (signal) => {
      // Audio signaling handler
    },
  });

  // Watch for session status changing to COMPLETED across devices
  useEffect(() => {
    if (realtimeSession.status === 'COMPLETED' && user && !analysisResult && !isAnalyzing && !analysisError) {
      fetchAnalysis(realtimeSession.id, user.id);
    }
  }, [realtimeSession.status, user, analysisResult, isAnalyzing, analysisError, fetchAnalysis]);

  // Host Action: Start Discussion
  const handleHostStartDiscussion = async () => {
    if (!user || !session) return;

    const res = await fetch('/api/gd/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to start GD.');
    }

    if (data.session) {
      setSession(data.session);
      broadcastHostStarted(data.session);
    }
  };

  // Host Action: End Discussion
  const handleHostEndDiscussion = async () => {
    if (!user || !session) return;

    const res = await fetch('/api/gd/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to end GD.');
    }

    if (data.session) {
      setSession(data.session);
      broadcastHostEnded(data.session);
      fetchAnalysis(data.session.id, user.id);
    }
  };

  const handleSelectParticipant = (targetUid: string) => {
    setSelectedUserId(targetUid);
    fetchAnalysis(realtimeSession.id, targetUid);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-semibold">Synchronizing with GD room...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Room Error</h2>
        <p className="text-xs text-rose-300">{error || 'Session not found.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const effectiveUserId = selectedUserId || user?.id || 'temp';
  const displayedParticipant = realtimeParticipants.find(p => p.user_id === effectiveUserId) || {
    id: effectiveUserId,
    session_id: session.id,
    user_id: effectiveUserId,
    participant_name: effectiveUserId === user?.id ? (user?.name || 'Participant') : 'Participant',
    is_host: session.host_id === effectiveUserId,
    joined_at: new Date().toISOString(),
    status: 'JOINED' as const,
  };

  const isHost = session.host_id === user?.id;

  // View 1: Post-Discussion Scorecard & AI Feedback View
  if (realtimeSession.status === 'COMPLETED') {
    if (isAnalyzing) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Gemini AI is Analyzing Discussion Transcripts...
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Evaluating individual spoken contributions across 11 competency dimensions, analyzing speaking time, detecting filler words, and compiling evidence-backed recommendations.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing participant speech data...
          </div>
        </div>
      );
    }

    if (analysisError || !analysisResult || !analysisFeedback) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Discussion completed.
              </h2>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                Your transcript has been safely saved.
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AI analysis is temporarily unavailable. Please retry analysis.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => fetchAnalysis(realtimeSession.id, user?.id)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Analysis
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ScorecardView
        session={realtimeSession}
        result={analysisResult}
        feedback={analysisFeedback}
        participant={displayedParticipant}
        isHost={isHost}
        allParticipantsOverview={allParticipantsOverview}
        allTranscripts={realtimeTranscripts}
        onSelectParticipant={handleSelectParticipant}
        onRetryAnalysis={() => fetchAnalysis(realtimeSession.id, user?.id)}
      />
    );
  }

  // View 2: Active Live Discussion Room
  if (realtimeSession.status === 'ACTIVE') {
    return (
      <ActiveDiscussionRoom
        session={realtimeSession}
        participants={realtimeParticipants}
        transcripts={realtimeTranscripts}
        currentUser={user || { id: 'temp-user', name: 'User' }}
        isHost={isHost}
        connectionStatus={connectionStatus}
        activeSpeakers={activeSpeakers}
        onNewTranscript={broadcastNewTranscript}
        onTurnChange={broadcastTurnChange}
        onEndDiscussion={handleHostEndDiscussion}
        onSendWebRTCSignal={sendWebRTCSignal}
        onBroadcastSpeakerState={broadcastSpeakerState}
      />
    );
  }

  // View 3: Waiting Room (Before host starts)
  return (
    <>
      <WaitingRoom
        session={realtimeSession}
        participants={realtimeParticipants}
        currentUser={user || { id: 'temp-user', name: 'User' }}
        isHost={isHost}
        onStartDiscussion={handleHostStartDiscussion}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
