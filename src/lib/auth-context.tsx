'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInQuickProfile: (name: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserProfile: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRESET_USERS = {
  host: {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Sri Hariharan',
    email: 'sri.hariharan@intelligd.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  arun: {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Arun Kumar',
    email: 'arun.k@intelligd.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  priya: {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Priya Sharma',
    email: 'priya.s@intelligd.com',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  karthik: {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'Karthik Raja',
    email: 'karthik.r@intelligd.com',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user session on mount
  useEffect(() => {
    async function initAuth() {
      // 1. Check local session cookie or storage
      try {
        const storedUser = localStorage.getItem('intelligd_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.id) {
            setUser(parsed);
            document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=604800; SameSite=Lax`;
            setLoading(false);
            return;
          }
        }
      } catch {
        // Continue
      }

      // 2. Check Supabase Auth
      try {
        const supabase = createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();

        if (sbUser) {
          const profile: UserProfile = {
            id: sbUser.id,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
            email: sbUser.email || '',
            avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
            created_at: sbUser.created_at,
          };
          setUser(profile);
          localStorage.setItem('intelligd_user', JSON.stringify(profile));
          document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          // Default initial demo host profile for immediate accessibility if not logged in
          const defaultUser = PRESET_USERS.host;
          setUser(defaultUser);
          localStorage.setItem('intelligd_user', JSON.stringify(defaultUser));
          document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(defaultUser))}; path=/; max-age=604800; SameSite=Lax`;
        }
      } catch {
        const defaultUser = PRESET_USERS.host;
        setUser(defaultUser);
        localStorage.setItem('intelligd_user', JSON.stringify(defaultUser));
        document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(defaultUser))}; path=/; max-age=604800; SameSite=Lax`;
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
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
      if (error) throw error;
    } catch (err) {
      console.warn('Google OAuth initiation note:', err);
      // Fallback: prompt for user name for rapid multi-device testing
      const customName = prompt('Enter your full name for this GD session:', 'Sri Hariharan');
      if (customName) {
        await signInQuickProfile(customName);
      }
    }
  };

  const signInQuickProfile = async (name: string, email?: string) => {
    const cleanName = name.trim() || 'Participant';
    const cleanEmail = email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@intelligd.com`;
    
    // Check if matching preset
    const presetKey = Object.keys(PRESET_USERS).find(
      k => PRESET_USERS[k as keyof typeof PRESET_USERS].name.toLowerCase() === cleanName.toLowerCase()
    );

    let profile: UserProfile;
    if (presetKey) {
      profile = PRESET_USERS[presetKey as keyof typeof PRESET_USERS];
    } else {
      // Deterministic UUID for easy multi-device consistency
      let hash = 0;
      for (let i = 0; i < cleanEmail.length; i++) {
        hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(12, '0');
      const customId = `00000000-0000-4000-a000-${hex.slice(0, 12)}`;

      profile = {
        id: customId,
        name: cleanName,
        email: cleanEmail,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
        created_at: new Date().toISOString(),
      };
    }

    setUser(profile);
    localStorage.setItem('intelligd_user', JSON.stringify(profile));
    document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=604800; SameSite=Lax`;
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue
    }
    setUser(null);
    localStorage.removeItem('intelligd_user');
    document.cookie = 'intelligd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const setUserProfile = (newProfile: UserProfile | null) => {
    setUser(newProfile);
    if (newProfile) {
      localStorage.setItem('intelligd_user', JSON.stringify(newProfile));
      document.cookie = `intelligd_user=${encodeURIComponent(JSON.stringify(newProfile))}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem('intelligd_user');
      document.cookie = 'intelligd_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInQuickProfile,
        signOut,
        setUserProfile,
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
