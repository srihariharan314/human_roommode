import React from 'react';
import Link from 'next/link';
import { Users, Sparkles, Shield, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Users className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">
                Intelli<span className="text-emerald-400">GD</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Practice. Participate. Improve.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link>
            <Link href="/#scoring" className="hover:text-emerald-400 transition-colors">10-Metric AI Model</Link>
            <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">User Dashboard</Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 IntelliGD Platform. Pure Human Group Discussion with Post-Discussion AI Analysis.</p>
          <div className="flex items-center gap-1">
            <span>Built for high-performance GD preparation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
