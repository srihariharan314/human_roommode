import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';
import { getOrCreateUserProfile } from '@/lib/db';

export async function getCurrentUser(): Promise<UserProfile | null> {
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
    console.warn('Supabase auth check note:', err);
  }

  return null;
}
