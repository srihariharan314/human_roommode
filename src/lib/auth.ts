import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';
import { getOrCreateUserProfile } from '@/lib/db';
import { cookies } from 'next/headers';

export async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const simulatedUserCookie = cookieStore.get('intelligd_user');

  if (simulatedUserCookie?.value) {
    try {
      const parsed = JSON.parse(simulatedUserCookie.value);
      if (parsed?.id) {
        return getOrCreateUserProfile(parsed);
      }
    } catch {
      // Ignore parse error
    }
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      return getOrCreateUserProfile({
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        email: user.email || 'user@intelligd.com',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      });
    }
  } catch (err) {
    // Supabase auth fallback
  }

  return null;
}
