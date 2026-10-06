'use client';

import React from 'react';
import { TopicPrepMaterial } from '@/types';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Globe, 
  CheckCircle2, 
  HelpCircle, 
  Tag, 
  FileText 
} from 'lucide-react';

interface TopicPrepDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  material: TopicPrepMaterial;
}

export function TopicPrepDrawer({ isOpen, onClose, topic, material }: TopicPrepDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI Topic Preparation Kit
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {topic}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto pr-2 flex-1">
          
          {/* Overview */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Topic Overview
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {material.overview}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> Key Pillars of Discussion
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {material.keyPoints.map((point, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-300 leading-normal">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arguments For vs Against */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* For */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Arguments In Favor / Pro
              </h4>
              <ul className="space-y-2">
                {material.argumentsFor.map((arg, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{arg}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Against */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" /> Arguments Against / Con
              </h4>
              <ul className="space-y-2">
                {material.argumentsAgainst.map((arg, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{arg}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Real World Examples & Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Examples */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Real-World Examples & Case Studies
              </h4>
              <ul className="space-y-2">
                {material.realWorldExamples.map((ex, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Facts */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Key Facts & Statistics
              </h4>
              <ul className="space-y-2">
                {material.importantFacts.map((fact, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">#</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Keywords */}
          {material.keywords && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> High-Impact Keywords to Use
              </h4>
              <div className="flex flex-wrap gap-2">
                {material.keywords.map((kw, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-emerald-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Synthesis Conclusion */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Suggested Synthesis Conclusion
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {material.conclusion}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Close & Return to Discussion
          </button>
        </div>
      </div>
    </div>
  );
}
