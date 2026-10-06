'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserDashboardStats } from '@/types';
import { 
  Trophy, 
  Users, 
  Flame, 
  PlusCircle, 
  KeyRound, 
  TrendingUp, 
  Clock, 
  Award, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Loader2,
  Target
} from 'lucide-react';
import { CreateGDModal } from '@/components/CreateGDModal';
import { JoinGDModal } from '@/components/JoinGDModal';
import { AuthModal } from '@/components/AuthModal';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchStats();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-medium">Loading your GD performance dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Sign In to View Dashboard</h2>
        <p className="text-xs text-slate-400">
          Access your personal group discussion history, AI scorecards, and skill analytics.
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg"
        >
          Sign In / Switch Profile
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const userStats = stats || {
    totalGDs: 1,
    gdsHosted: 1,
    averageScore: 82,
    bestScore: 86,
    metrics: {
      communication: 85,
      confidence: 79,
      clarity: 88,
      fluency: 76,
      relevance: 91,
      reasoning: 84,
      topic_knowledge: 80,
      participation: 86,
      teamwork: 83,
      leadership: 77,
    },
    recentSessions: [
      {
        sessionId: 'demo-session-1',
        topic: 'Is Artificial Intelligence a Boon or a Bane?',
        date: 'Today',
        overallScore: 82,
        role: 'Host' as const,
        communication: 85,
        confidence: 79,
        fluency: 76,
      }
    ],
  };

  const METRIC_RADAR = [
    { label: 'Communication', score: userStats.metrics.communication },
    { label: 'Confidence', score: userStats.metrics.confidence },
    { label: 'Clarity', score: userStats.metrics.clarity },
    { label: 'Fluency', score: userStats.metrics.fluency },
    { label: 'Relevance', score: userStats.metrics.relevance },
    { label: 'Reasoning', score: userStats.metrics.reasoning },
    { label: 'Topic Knowledge', score: userStats.metrics.topic_knowledge },
    { label: 'Participation', score: userStats.metrics.participation },
    { label: 'Teamwork', score: userStats.metrics.teamwork },
    { label: 'Leadership', score: userStats.metrics.leadership },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* 1. Profile Top Banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-xl"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Verified Candidate
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Join Human GD
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Create Human GD
            </button>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total GDs</span>
            <div className="text-2xl font-black text-white">{userStats.totalGDs}</div>
          </div>
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">GDs Hosted</span>
            <div className="text-2xl font-black text-emerald-400">{userStats.gdsHosted}</div>
          </div>
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Average Score</span>
            <div className="text-2xl font-black text-cyan-400 font-mono">{userStats.averageScore} <span className="text-xs text-slate-400 font-normal">/100</span></div>
          </div>
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Best Performance</span>
            <div className="text-2xl font-black text-amber-400 font-mono">{userStats.bestScore} <span className="text-xs text-slate-400 font-normal">/100</span></div>
          </div>
        </div>
      </div>

      {/* 2. 10 Competencies Performance Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Cumulative 10-Dimensional GD Competencies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregate performance metrics synthesized across all completed discussion sessions.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Gemini AI Analyzed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {METRIC_RADAR.map((m) => (
            <div key={m.label} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{m.label}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{m.score}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                  style={{ width: `${m.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recent GD Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Discussion Session History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review personal feedback, strengths, weaknesses & transcripts from past GDs.
            </p>
          </div>
        </div>

        {userStats.recentSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs">No discussion sessions recorded yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-4 py-2 bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Start Your First GD
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Overall Score</th>
                  <th className="pb-3">Communication</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userStats.recentSessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-white max-w-xs truncate pr-4">
                      {s.topic}
                    </td>
                    <td className="py-4 text-slate-400 font-mono">
                      {s.date}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.role === 'Host' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-4 font-mono font-bold text-emerald-400">
                      {s.overallScore} / 100
                    </td>
                    <td className="py-4 font-mono text-slate-300">
                      {s.communication}%
                    </td>
                    <td className="py-4 font-mono text-slate-300">
                      {s.confidence}%
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/human-gd/room/${s.sessionId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View Report <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGDModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinGDModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

    </div>
  );
}
