'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GDResult, 
  GDFeedback, 
  GDSession, 
  Participant, 
  ParticipantScoreOverview, 
  TranscriptItem,
  StructuredStrength,
  StructuredWeakness,
  ArgumentAnalysisItem,
  ContextualResponseItem,
  RepetitionDetail,
  ActionPlanItem
} from '@/types';
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
  Target,
  Users,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Mic,
  FileText,
  Repeat,
  Layers,
  Compass,
  Award
} from 'lucide-react';

interface ScorecardViewProps {
  session: GDSession;
  result: GDResult;
  feedback: GDFeedback;
  participant: Participant;
  isHost: boolean;
  allParticipantsOverview?: ParticipantScoreOverview[];
  allTranscripts?: TranscriptItem[];
  onSelectParticipant?: (userId: string) => void;
  onRetryAnalysis?: () => void;
}

export function ScorecardView({
  session,
  result,
  feedback,
  participant,
  isHost,
  allParticipantsOverview = [],
  allTranscripts = [],
  onSelectParticipant,
  onRetryAnalysis,
}: ScorecardViewProps) {
  const [activeTab, setActiveTab] = useState<'SCORECARD' | 'OVERVIEW' | 'TRANSCRIPTS'>(
    isHost && allParticipantsOverview.length > 1 ? 'OVERVIEW' : 'SCORECARD'
  );
  
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
    { label: 'Overall Performance', score: result.overall_score, desc: 'Composite weighted evaluation across all discussion dimensions' },
    { label: 'Communication', score: result.communication_score, desc: 'Vocabulary, articulation & sentence structure' },
    { label: 'Confidence', score: result.confidence_score, desc: 'Assertiveness, strength of delivery & observable posture' },
    { label: 'Clarity', score: result.clarity_score, desc: 'Precision of thought & directness of expression' },
    { label: 'Fluency', score: result.fluency_score, desc: 'Speaking flow, smooth pauses & filler mitigation' },
    { label: 'Relevance', score: result.relevance_score, desc: 'Topic adherence without deviation or drifting' },
    { label: 'Reasoning', score: result.reasoning_score, desc: 'Logical cause-and-effect thinking & supporting evidence' },
    { label: 'Topic Knowledge', score: result.topic_knowledge_score, desc: 'Conceptual depth, case studies & nuanced insight' },
    { label: 'Participation', score: result.participation_score, desc: 'Speaking turn frequency & active verbal presence' },
    { label: 'Teamwork', score: result.teamwork_score, desc: 'Active listening, building on peer points & respectful debate' },
    { label: 'Leadership', score: result.leadership_score, desc: 'Moderation, structuring discussion flow & synthesis' },
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

  const getRelevanceBadge = (rel: string) => {
    switch (rel) {
      case 'Highly Relevant':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Relevant':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Partially Relevant':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Off-topic':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const confidence = result.confidence_in_evaluation || feedback.confidence_in_evaluation || 'High';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      
      {/* Navigation Switcher for Host / Participant */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              GD Results Leaderboard ({allParticipantsOverview.length || 1})
            </button>
          )}

          <button
            onClick={() => setActiveTab('SCORECARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'SCORECARD'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            {isHost ? `Participant Analysis: ${participant.participant_name}` : 'My GD Performance'}
          </button>

          <button
            onClick={() => setActiveTab('TRANSCRIPTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TRANSCRIPTS'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Saved Transcripts ({allTranscripts.length})
          </button>
        </div>

        {isHost && allParticipantsOverview.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Candidate:</span>
            <select
              value={participant.user_id}
              onChange={(e) => {
                if (onSelectParticipant) onSelectParticipant(e.target.value);
                setActiveTab('SCORECARD');
              }}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {allParticipantsOverview.map(po => (
                <option key={po.participant.user_id} value={po.participant.user_id}>
                  {po.participant.participant_name} ({po.result?.overall_score ?? '--'}/100)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: HOST OVERALL GD RESULTS LEADERBOARD */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block mb-2">
                  Session Completed • Host Leaderboard
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  GD Results Summary
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Topic: <span className="text-slate-200 font-medium">"{session.topic}"</span> • Room Code: <span className="font-mono text-emerald-400">{session.room_code}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onRetryAnalysis}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-analyze All
                </button>
              </div>
            </div>

            {/* Participants Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Participant</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Overall Score</th>
                    <th className="pb-3">Speaking Time</th>
                    <th className="pb-3">Turns</th>
                    <th className="pb-3">Communication</th>
                    <th className="pb-3">Reasoning</th>
                    <th className="pb-3">Fillers</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allParticipantsOverview.map((item) => {
                    const res = item.result;
                    return (
                      <tr 
                        key={item.participant.user_id} 
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => {
                          if (onSelectParticipant) onSelectParticipant(item.participant.user_id);
                          setActiveTab('SCORECARD');
                        }}
                      >
                        <td className="py-4 pl-2 font-bold text-white flex items-center gap-2.5">
                          <img
                            src={item.participant.participant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.participant.user_id}`}
                            alt={item.participant.participant_name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div>{item.participant.participant_name}</div>
                            {item.participant.user_id === participant.user_id && (
                              <span className="text-[9px] text-emerald-400 font-normal">(Active View)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.participant.is_host ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {item.participant.is_host ? 'Host' : 'Participant'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${getScoreColor(res?.overall_score || 0)}`}>
                            {res?.overall_score ?? '--'} / 100
                          </span>
                        </td>
                        <td className="py-4 font-mono text-slate-300">
                          {res?.speaking_time_formatted || '0s'}
                        </td>
                        <td className="py-4 font-mono text-slate-300">
                          {res?.speaking_turns ?? 0}
                        </td>
                        <td className="py-4 font-mono text-emerald-400">
                          {res?.communication_score ? `${res.communication_score}%` : '--'}
                        </td>
                        <td className="py-4 font-mono text-cyan-400">
                          {res?.reasoning_score ? `${res.reasoning_score}%` : '--'}
                        </td>
                        <td className="py-4 font-mono text-amber-400">
                          {res?.filler_word_count ?? 0}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectParticipant) onSelectParticipant(item.participant.user_id);
                              setActiveTab('SCORECARD');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            View Analysis <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: INDIVIDUAL SCORECARD & FEEDBACK */}
      {activeTab === 'SCORECARD' && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* 1. Header Banner */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Evidence-Based AI Assessment
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    confidence === 'High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    confidence === 'Medium' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    Evaluation Confidence: {confidence}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  YOUR GD PERFORMANCE
                </h1>
                <div className="text-sm font-bold text-emerald-400">
                  {participant.participant_name} {participant.is_host && <span className="text-xs text-amber-400 font-normal">(Host)</span>}
                </div>
                <p className="text-xs text-slate-300">
                  Topic: <span className="text-slate-200 font-medium">"{session.topic}"</span>
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
                    Overall Performance
                  </span>
                  <div className="text-sm font-bold text-white">
                    {result.overall_score >= 90 ? 'Exceptional Discussion' :
                     result.overall_score >= 80 ? 'Very Good Contribution' :
                     result.overall_score >= 70 ? 'Good Competency' :
                     result.overall_score >= 60 ? 'Average Engagement' :
                     result.overall_score >= 50 ? 'Needs Improvement' : 'Weak Contribution'}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> Evaluated Across 11 Dimensions
                  </div>
                </div>
              </div>
            </div>

            {/* Speaking Analysis Measurable Stats Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                Speaking Analysis
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Speaking Time</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{result.speaking_time_formatted}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{result.is_speaking_time_estimated ? 'Estimated speaking time' : 'Recorded duration'}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Speaking Turns</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">{result.speaking_turns ?? 1} turns</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Verbal entries</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Turn Duration</span>
                  <span className="text-sm font-bold text-teal-400 font-mono">{result.average_turn_seconds ? `${result.average_turn_seconds}s` : '15s'}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Per turn average</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filler Words</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{result.filler_word_count} words</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{result.filler_words_detected?.length ? result.filler_words_detected.map(f => `"${f.word}": ${f.count}`).slice(0, 2).join(', ') : 'None detected'}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repeated Ideas</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">{result.repetition_count} instances</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Repetition metric</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 11-Dimensional Competency Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              11-Dimensional Competency Scorecard
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

                  {/* Score Bar */}
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

          {/* 3. Structured Strengths & Areas to Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strengths */}
            <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Evidence-Based Strengths
              </h3>
              <div className="space-y-3">
                {feedback.strengths.map((str, idx) => {
                  if (typeof str === 'object' && str !== null) {
                    const s = str as StructuredStrength;
                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {s.title}
                        </div>
                        {s.evidence && (
                          <div className="text-[11px] text-slate-300 italic bg-slate-950/50 p-2 rounded-lg border border-emerald-500/10">
                            "{s.evidence}"
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300">
                          <strong className="text-emerald-400">Impact:</strong> {s.impact}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="text-xs text-slate-200 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{String(str)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Areas to Improve */}
            <div className="bg-slate-900 border border-rose-500/20 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Areas for Improvement & Actionable Fixes
              </h3>
              <div className="space-y-3">
                {feedback.weaknesses.map((weak, idx) => {
                  if (typeof weak === 'object' && weak !== null) {
                    const w = weak as StructuredWeakness;
                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {w.title}
                        </div>
                        {w.evidence && (
                          <div className="text-[11px] text-slate-300 italic bg-slate-950/50 p-2 rounded-lg border border-rose-500/10">
                            "{w.evidence}"
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300">
                          <strong className="text-rose-400">Impact:</strong> {w.impact}
                        </div>
                        {w.improvement && (
                          <div className="text-[11px] text-amber-300 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                            <strong className="text-amber-400">Action:</strong> {w.improvement}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="text-xs text-slate-200 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/20 border border-rose-500/10">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{String(weak)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 4. Stage 1: Argument Analysis & Logical Structure Breakdown */}
          {feedback.argument_analysis && feedback.argument_analysis.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                Argument Quality & Reasoning Depth Breakdown
              </h3>
              <p className="text-xs text-slate-400 -mt-2">
                Evaluation of claims made, causal explanation depth, and supporting evidence cited.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.argument_analysis.map((arg: ArgumentAnalysisItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">Point #{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRelevanceBadge(arg.relevance)}`}>
                        {arg.relevance}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Claim:</span>
                      <p className="text-xs text-emerald-300 font-medium">{arg.claim}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Reasoning (Why):</span>
                      <p className="text-xs text-slate-300">{arg.reasoning}</p>
                    </div>
                    {arg.examples && arg.examples !== 'None provided' && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Examples Cited:</span>
                        <p className="text-xs text-cyan-300 italic">{arg.examples}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Contextual Peer Responses & Discussion Engagement */}
          {feedback.contextual_responses && feedback.contextual_responses.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Peer Interaction & Discussion Progression
              </h3>
              <div className="space-y-3">
                {feedback.contextual_responses.map((cr: ContextualResponseItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">Responding to: {cr.respondingTo}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                        {cr.nature}
                      </span>
                    </div>
                    <blockquote className="text-xs text-slate-300 italic border-l-2 border-cyan-500/50 pl-3 py-1 bg-slate-900/50 rounded-r-lg">
                      "{cr.quote}"
                    </blockquote>
                    <p className="text-xs text-slate-400">
                      <strong className="text-emerald-400">Evaluation:</strong> {cr.assessment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Repetition Analysis (if applicable) */}
          {feedback.repetition_details && feedback.repetition_details.length > 0 && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Repeat className="w-4 h-4" /> Idea Repetition Analysis
              </h3>
              <p className="text-xs text-slate-400 -mt-1">
                Occurrences where the same underlying concept was restated without adding fresh dimensions.
              </p>
              <div className="space-y-2.5">
                {feedback.repetition_details.map((rep: RepetitionDetail, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>Repeated Idea: {rep.repeatedIdea}</span>
                      <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                        {rep.occurrences} occurrences
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong className="text-amber-400">Strategic Fix:</strong> {rep.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Evidence-Based Spoken Citations */}
          {feedback.evidence_examples && feedback.evidence_examples.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Quote className="w-5 h-5 text-cyan-400" />
                Spoken Evidence & Coaching Observations
              </h3>
              <p className="text-xs text-slate-400 -mt-2">
                Direct quotes extracted from your recorded speech in this discussion.
              </p>

              <div className="space-y-3">
                {feedback.evidence_examples.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <span>Observed Turn / Area:</span> {item.claimOrArea}
                    </div>
                    <blockquote className="text-xs text-slate-300 italic border-l-2 border-cyan-500/50 pl-3 py-1.5 bg-slate-900/50 rounded-r-lg font-sans">
                      "{item.quote}"
                    </blockquote>
                    <div className="text-xs text-slate-300">
                      <strong className="text-emerald-400">AI Observation:</strong> {item.aiObservation}
                    </div>
                    <div className="text-xs text-slate-400">
                      <strong className="text-amber-400">Recommendation:</strong> {item.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Action Plan & Framework Mastery */}
          {feedback.action_plan && feedback.action_plan.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Tailored GD Action Plan & Frameworks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.action_plan.map((ap: ActionPlanItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Award className="w-4 h-4" />
                      {ap.area}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      Technique: <span className="text-teal-300">{ap.technique}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-slate-300">Application:</strong> {ap.example}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Detailed AI Feedback & Actionable Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Comprehensive Session Summary
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                {feedback.detailed_feedback}
              </p>
            </div>

            {/* Actionable Recommendations */}
            {feedback.actionable_recommendations && feedback.actionable_recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4" /> Practical GD Checklist for Next Session
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
            )}
          </div>

        </div>
      )}

      {/* VIEW 3: SAVED TRANSCRIPTS LOG */}
      {activeTab === 'TRANSCRIPTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Complete Recorded Transcripts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Session: {session.room_code} • {allTranscripts.length} total speech segment{allTranscripts.length === 1 ? '' : 's'} recorded safely.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {allTranscripts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs">No transcripts recorded for this session.</p>
              </div>
            ) : (
              allTranscripts.map((t, idx) => {
                const isTargetUser = t.user_id === participant.user_id;
                const formattedTime = new Date(t.timestamp || t.created_at || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                return (
                  <div
                    key={t.id || idx}
                    className={`p-3.5 rounded-2xl border ${
                      isTargetUser
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isTargetUser ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {t.participant_name}
                        </span>
                        {isTargetUser && (
                          <span className="text-[9px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                            Candidate
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formattedTime}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {t.text || t.transcript}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-800">
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
