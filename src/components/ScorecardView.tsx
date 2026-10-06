'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { GDResult, GDFeedback, GDSession, Participant } from '@/types';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Flame, 
  HelpCircle, 
  ArrowRight, 
  LayoutDashboard, 
  ShieldCheck, 
  Lightbulb, 
  Quote,
  Target
} from 'lucide-react';

interface ScorecardViewProps {
  session: GDSession;
  result: GDResult;
  feedback: GDFeedback;
  participant: Participant;
  isHost: boolean;
}

export function ScorecardView({
  session,
  result,
  feedback,
  participant,
  isHost,
}: ScorecardViewProps) {
  
  // Confetti on high score
  useEffect(() => {
    if (result.overall_score >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.overall_score]);

  const METRIC_LIST = [
    { label: 'Communication', score: result.communication_score, desc: 'Vocabulary, articulation & sentence structure' },
    { label: 'Confidence', score: result.confidence_score, desc: 'Assertiveness, delivery & conviction' },
    { label: 'Clarity', score: result.clarity_score, desc: 'Precision of thought & directness' },
    { label: 'Fluency', score: result.fluency_score, desc: 'Speaking flow, smooth pauses & tempo' },
    { label: 'Relevance', score: result.relevance_score, desc: 'Topic adherence without deviation' },
    { label: 'Reasoning', score: result.reasoning_score, desc: 'Logical cause-and-effect & evidence' },
    { label: 'Topic Knowledge', score: result.topic_knowledge_score, desc: 'Factual depth, examples & nuances' },
    { label: 'Participation', score: result.participation_score, desc: 'Turn frequency & active verbal presence' },
    { label: 'Teamwork', score: result.teamwork_score, desc: 'Listening, building on others & respect' },
    { label: 'Leadership', score: result.leadership_score, desc: 'Moderation, direction & summarizing flow' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 65) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (score >= 65) return 'bg-gradient-to-r from-cyan-500 to-blue-400';
    if (score >= 50) return 'bg-gradient-to-r from-amber-500 to-orange-400';
    return 'bg-gradient-to-r from-rose-500 to-red-400';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">
        
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Post-Discussion AI Assessment
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              GD Performance Scorecard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Evaluated participant: <strong className="text-emerald-400">{participant.participant_name}</strong> • Topic: <span className="text-slate-200">"{session.topic}"</span>
            </p>
          </div>

          {/* Large Overall Score Dial */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-inner">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 shadow-xl">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  {result.overall_score}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-bold">/ 100</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Overall Rating
              </span>
              <div className="text-sm font-bold text-white">
                {result.overall_score >= 80 ? 'Exceptional Discussion' :
                 result.overall_score >= 65 ? 'Strong Performance' :
                 result.overall_score >= 50 ? 'Developing Competency' : 'Needs Practice'}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Based on 10 GD Competencies
              </div>
            </div>
          </div>
        </div>

        {/* Measurable Stats Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Speaking Time</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{result.speaking_time_formatted}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filler Words Detected</span>
            <span className="text-base font-bold text-amber-400 font-mono">{result.filler_word_count} words</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Idea Repetitions</span>
            <span className="text-base font-bold text-cyan-400 font-mono">{result.repetition_count} instances</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Participant Role</span>
            <span className="text-base font-bold text-slate-200">{participant.is_host ? 'Host Leader' : 'Active Contributor'}</span>
          </div>
        </div>
      </div>

      {/* 2. 10-Dimensional Breakdown Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          10-Dimensional Competency Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {METRIC_LIST.map((m) => (
            <div key={m.label} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{m.label}</span>
                  <span className="text-[10px] text-slate-400">{m.desc}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border font-mono ${getScoreColor(m.score)}`}>
                  {m.score}/100
                </span>
              </div>

              {/* Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(m.score)} rounded-full transition-all duration-500`}
                  style={{ width: `${m.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Strengths */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Core Strengths
          </h3>
          <ul className="space-y-2.5">
            {feedback.strengths.map((str, idx) => (
              <li key={idx} className="text-xs text-slate-200 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-slate-900 border border-rose-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Areas For Improvement
          </h3>
          <ul className="space-y-2.5">
            {feedback.weaknesses.map((weak, idx) => (
              <li key={idx} className="text-xs text-slate-200 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/20 border border-rose-500/10">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{weak}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* 4. Evidence-Based Quotes & Observations */}
      {feedback.evidence_examples && feedback.evidence_examples.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Quote className="w-5 h-5 text-cyan-400" />
            Evidence-Based Spoken Analysis
          </h3>
          <p className="text-xs text-slate-400 -mt-2">
            Direct observations anchored to your recorded statements during the discussion.
          </p>

          <div className="space-y-3">
            {feedback.evidence_examples.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <span>Observation Area:</span> {item.claimOrArea}
                </div>
                <blockquote className="text-xs text-slate-300 italic border-l-2 border-cyan-500/50 pl-3 py-1 bg-slate-900/50 rounded-r-lg">
                  "{item.quote}"
                </blockquote>
                <div className="text-xs text-slate-300">
                  <strong className="text-emerald-400">AI Assessment:</strong> {item.aiObservation}
                </div>
                <div className="text-xs text-slate-400">
                  <strong className="text-amber-400">Coach Suggestion:</strong> {item.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Detailed AI Feedback & Actionable Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Comprehensive Post-GD Narrative
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            {feedback.detailed_feedback}
          </p>
        </div>

        {/* Actionable Recommendations */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" /> Actionable Strategies for Next GD
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feedback.actionable_recommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs text-slate-200 leading-normal">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" /> Return to Dashboard & History
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          Host Another Human GD <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
