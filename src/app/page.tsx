'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  Sparkles, 
  Mic, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Play, 
  PlusCircle, 
  Radio, 
  Target, 
  Award, 
  Zap, 
  Share2, 
  Layers 
} from 'lucide-react';
import { CreateGDModal } from '@/components/CreateGDModal';
import { JoinGDModal } from '@/components/JoinGDModal';
import { AuthModal } from '@/components/AuthModal';

export default function LandingPage() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const COMPETENCIES = [
    { name: 'Communication', desc: 'Clarity of expression, vocabulary & sentence structure' },
    { name: 'Confidence', desc: 'Assertiveness, strength of delivery & lack of hesitation' },
    { name: 'Clarity', desc: 'Precision of thought & direct message communication' },
    { name: 'Fluency', desc: 'Speaking flow, smooth pauses & minimal filler words' },
    { name: 'Relevance', desc: 'Consistent topic adherence without drifting off-track' },
    { name: 'Reasoning', desc: 'Logical cause-and-effect thinking & supporting evidence' },
    { name: 'Topic Knowledge', desc: 'Factual depth, case studies & contextual understanding' },
    { name: 'Participation', desc: 'Number of active contributions & sustained engagement' },
    { name: 'Teamwork', desc: 'Active listening, building on peer points & respectful debate' },
    { name: 'Leadership', desc: 'Initiating structured points, moderation & summarizing flow' },
  ];

  return (
    <div className="relative overflow-hidden">
      
      {/* Background Radiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-[140px] pointer-events-none" />
      
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Capsule Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs sm:text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 shadow-lg shadow-emerald-500/5">
          <Sparkles className="w-4 h-4" />
          <span>Real-time Human GD • Post-Discussion AI Assessment</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Intelli<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">GD</span>
          <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-300 mt-2">
            Practice. Participate. Improve.
          </span>
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          An AI-powered platform for realistic online Group Discussions with realtime collaboration and personalized performance feedback.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-8 py-4 text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-2xl shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <PlusCircle className="w-5 h-5 fill-slate-950 stroke-emerald-400" />
            Create a GD
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <Users className="w-5 h-5 text-cyan-400" />
            Join a GD
          </button>

          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-6 py-4 text-sm font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-2xl transition-all"
            >
              Sign in with Google
            </button>
          )}

        </div>

        {/* Live Discussion Preview Visual */}
        <div className="relative max-w-4xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-4 sm:p-6 text-left backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">Room: IGD-7K42P • Topic: "Is AI a Boon or a Bane?"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Multi-User Room
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Participants snapshot */}
            <div className="space-y-2 p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Active Participants (4)
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold text-xs">SH</div>
                  <div>
                    <div className="text-xs font-bold text-white">Sri Hariharan</div>
                    <div className="text-[9px] text-emerald-400 font-medium">🟢 Speaking...</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">HOST</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-bold text-xs">AK</div>
                <div>
                  <div className="text-xs font-bold text-white">Arun Kumar</div>
                  <div className="text-[9px] text-slate-400">Listening</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-400/20 text-violet-400 flex items-center justify-center font-bold text-xs">PS</div>
                <div>
                  <div className="text-xs font-bold text-white">Priya Sharma</div>
                  <div className="text-[9px] text-slate-400">Listening</div>
                </div>
              </div>
            </div>

            {/* Live Shared Transcript */}
            <div className="md:col-span-2 space-y-2.5 p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 font-sans">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Synchronized Speech Transcripts</span>
                <span className="text-[10px] font-mono text-emerald-400">Web Speech API</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-0.5">
                  <span>Sri Hariharan (Host)</span>
                  <span className="text-[9px] text-slate-400 font-mono">10:42 AM</span>
                </div>
                <p className="text-xs text-slate-200">
                  "AI can dramatically improve productivity across healthcare and engineering, but governance is paramount."
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-0.5">
                  <span>Arun Kumar</span>
                  <span className="text-[9px] text-slate-400 font-mono">10:43 AM</span>
                </div>
                <p className="text-xs text-slate-200">
                  "I agree with Sri. However, we must also consider the immediate transition challenges for labor markets."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Key Pillars & Feature Architecture */}
      <section id="features" className="py-20 bg-slate-950/90 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              Engineered For Authentic Preparation
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white">
              Pure Human Discussions. AI-Powered Scorecards.
            </p>
            <p className="text-sm text-slate-400 mt-3">
              No simulated debaters or fake bots. Real participants join via unique room links and collaborate in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Real-Time Human Collaboration
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One persistent session per room. Hosts share a production join link or unique code. Participants connect from different devices and networks seamlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Independent Speech-to-Text
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each participant's browser microphone independently transcribes their spoken words, linking transcripts strictly to their verified user identity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl hover:border-teal-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Post-Discussion AI Analysis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI operates exclusively after the discussion ends. Gemini evaluates actual participant statements across 10 competency dimensions with evidence citations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. How It Works Step-by-Step Flow */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              Seamless End-to-End Workflow
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white">
              How IntelliGD Works
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-emerald-500/20">
                01
              </span>
              <h4 className="text-sm font-bold text-white mb-1">Create Human GD</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Host selects topic, generates Gemini preparation kit, and creates ONE session with a unique code.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-cyan-500/20">
                02
              </span>
              <h4 className="text-sm font-bold text-white mb-1">Invite Participants</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Share the production join link or WhatsApp invite. Real-time participant roster updates with zero countdown timer.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-teal-500/20">
                03
              </span>
              <h4 className="text-sm font-bold text-white mb-1">Live Discussion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Host starts GD. Everyone joins the active room. Speech is transcribed and synced across all participant screens.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-amber-500/20">
                04
              </span>
              <h4 className="text-sm font-bold text-white mb-1">AI Scorecard</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Discussion ends. Gemini analyzes actual quotes, calculates filler words & speaking time, and provides personal scorecards.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. 10 GD Competencies Evaluation System */}
      <section id="scoring" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              Comprehensive Assessment Engine
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white">
              The 10 GD Competency Dimensions
            </p>
            <p className="text-sm text-slate-400 mt-3">
              Standardized scoring rubric mimicking premier corporate hiring and MBA group discussion panels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {COMPETENCIES.map((c, i) => (
              <div key={c.name} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">0-100</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Final CTA Banner */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Ready to Ace Your Next Group Discussion?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Host a room, invite your peers, debate realistic topics, and get instant evidence-backed AI coaching.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-8 py-4 text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all"
            >
              Start a Human GD Session Now
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all"
            >
              Join with Room Code
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <CreateGDModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinGDModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

    </div>
  );
}
