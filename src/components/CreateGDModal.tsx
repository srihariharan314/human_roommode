'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  X, 
  Sparkles, 
  Users, 
  Clock, 
  BookOpen, 
  Flame, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Shield
} from 'lucide-react';
import { TopicPrepDrawer } from './TopicPrepDrawer';
import { TopicPrepMaterial } from '@/types';

interface CreateGDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_TOPICS = [
  "Is Artificial Intelligence a Boon or a Bane?",
  "Should Remote Work Completely Replace the Traditional Office?",
  "Will Electric Vehicles Truly Eliminate Carbon Emissions?",
  "The Impact of Social Media on Free Speech and Mental Health",
  "Is Higher Education Overvalued in the Modern Digital Economy?",
  "Cashless Economy: Financial Inclusivity vs Privacy Concerns",
  "Universal Basic Income: Solution to Automation or Deterrent to Work?"
];

export function CreateGDModal({ isOpen, onClose }: CreateGDModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [topic, setTopic] = useState(SUGGESTED_TOPICS[0]);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [prepMaterial, setPrepMaterial] = useState<TopicPrepMaterial | null>(null);
  const [showPrepPreview, setShowPrepPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePrep = async () => {
    if (!topic.trim()) return;
    setGeneratingPrep(true);
    setError(null);
    try {
      const res = await fetch('/api/gd/topic-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (data.prep) {
        setPrepMaterial(data.prep);
        setShowPrepPreview(true);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate topic prep material.');
    } finally {
      setGeneratingPrep(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please select or enter a topic.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gd/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          maxParticipants,
          durationSeconds: durationMinutes * 60,
          generatePrep: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create GD session.');
      }

      onClose();
      // Navigate to the created room
      router.push(`/human-gd/room/${data.session.id}`);
    } catch (err: any) {
      console.error('Error creating GD:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          {/* Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold tracking-wide uppercase mb-1">
                <Users className="w-3 h-3" /> Host New Discussion
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Create Human GD Room
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateSession} className="space-y-6 overflow-y-auto pr-1 flex-1">
            
            {/* Topic Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Discussion Topic
              </label>
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter custom topic or choose from suggestions below..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                required
              />

              {/* Suggestions */}
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Suggested topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TOPICS.slice(0, 4).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-full ${
                        topic === t
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Topic Prep Helper */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Gemini Topic Preparation Kit
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generates overview, key arguments, real examples, facts & counterpoints.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePrep}
                disabled={generatingPrep || !topic.trim()}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {generatingPrep ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    {prepMaterial ? 'View Prep Kit' : 'Preview Prep Kit'}
                  </>
                )}
              </button>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Max Participants */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Max Participants
                  </label>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {maxParticipants} Users
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3 min</span>
                  <span>8 standard</span>
                  <span>12 max</span>
                </div>
              </div>

              {/* Discussion Duration */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Discussion Duration
                  </label>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {durationMinutes} Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>5 mins</span>
                  <span>15 standard</span>
                  <span>30 mins</span>
                </div>
              </div>

            </div>

            {/* Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Host Authority:</strong> You will control when the discussion starts and ends. All joined participants will synchronize automatically.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="px-6 py-3 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    Create Human GD Room <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Topic Prep Material Drawer/Modal */}
      {prepMaterial && (
        <TopicPrepDrawer
          isOpen={showPrepPreview}
          onClose={() => setShowPrepPreview(false)}
          topic={topic}
          material={prepMaterial}
        />
      )}
    </>
  );
}
