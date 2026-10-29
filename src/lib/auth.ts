import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';
import { getOrCreateUserProfile } from '@/lib/db';
import { cookies } from 'next/headers';

export async function getCurrentUser(): Promise<UserProfile | null> {
  // 1. Try Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      return getOrCreateUserProfile({
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || 'user@intelligd.com',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      });
    }
  } catch (err) {
    // Supabase auth check note
  }

  // 2. Try cookie session fallback (for guest / instant participant profiles)
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('intelligd_user')?.value;
    if (userCookie) {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      if (parsed && parsed.id && parsed.name) {
        return getOrCreateUserProfile({
          id: parsed.id,
          name: parsed.name,
          email: parsed.email || `${parsed.id}@participant.gd`,
          avatar_url: parsed.avatar_url,
        });
      }
    }
  } catch (cookieErr) {
    // Cookie parse fallback
  }

  return null;
}

