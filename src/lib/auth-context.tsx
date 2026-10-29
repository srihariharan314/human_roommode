'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string, email?: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXTPUBLIC_SUPABASE_URL;
  const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    !supabaseUrl.includes('placeholder') && 
    supabaseUrl.startsWith('https://')
  );

  // Helper: persist profile to cookies & localStorage for seamless server & client auth
  const persistUser = (profile: UserProfile | null) => {
    if (typeof window === 'undefined') return;
    if (profile) {
      localStorage.setItem('intelligd_user', JSON.stringify(profile));
      document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem('intelligd_user');
      document.cookie = `intelligd_user=; path=/; max-age=0; SameSite=Lax`;
    }
  };

  // Initialize Auth state
  useEffect(() => {
    let mounted = true;

    // 1. Immediately check localStorage/cookie for cached profile
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('intelligd_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id && parsed.name) {
            setUser(parsed);
          }
        }
      }
    } catch (e) {
      // Storage parse error
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function loadUser() {
      try {
        const { data: { user: sbUser }, error } = await supabase.auth.getUser();

        if (sbUser && !error) {
          const profile: UserProfile = {
            id: sbUser.id,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
            email: sbUser.email || '',
            avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
            created_at: sbUser.created_at,
          };
          if (mounted) {
            setUser(profile);
            persistUser(profile);
          }
        }
      } catch (err) {
        // Supabase offline/error fallback
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    // Subscribe to auth state changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            created_at: session.user.created_at,
          };
          if (mounted) {
            setUser(profile);
            persistUser(profile);
            setLoading(false);
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (subErr) {
      setLoading(false);
    }
  }, [isSupabaseConfigured]);

  const signInAsGuest = async (name: string, email?: string): Promise<UserProfile> => {
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Please enter your name.');
    }

    let guestId = '';
    if (typeof window !== 'undefined') {
      guestId = localStorage.getItem('intelligd_guest_id') || '';
    }
    if (!guestId) {
      guestId = crypto.randomUUID();
      if (typeof window !== 'undefined') {
        localStorage.setItem('intelligd_guest_id', guestId);
      }
    }

    const profile: UserProfile = {
      id: guestId,
      name: cleanName,
      email: email?.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@participant.gd`,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guestId)}`,
      created_at: new Date().toISOString(),
    };

    setUser(profile);
    persistUser(profile);
    return profile;
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. You can join directly by entering your participant name above.'
      );
    }

    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setUser(null);
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConfigured,
        signInWithGoogle,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

