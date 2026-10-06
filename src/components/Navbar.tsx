'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Sparkles, 
  Users, 
  PlusCircle, 
  LogIn, 
  LogOut, 
  User, 
  Flame, 
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { CreateGDModal } from './CreateGDModal';
import { JoinGDModal } from './JoinGDModal';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Users className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Intelli<span className="text-emerald-400">GD</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400/90 -mt-1 flex items-center gap-1">
                Human Discussion <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
            <Link 
              href="/#features" 
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/#how-it-works" 
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
            >
              How It Works
            </Link>
            <Link 
              href="/#scoring" 
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
            >
              AI Assessment
            </Link>
            {user && (
              <Link 
                href="/dashboard" 
                className="px-4 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Join Room
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              Create Human GD
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                  />
                  <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                      Dashboard & History
                    </Link>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAuthModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      Switch Profile / Account
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <CreateGDModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinGDModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </>
  );
}
