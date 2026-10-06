import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (user && !error) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        
        // Upsert user profile
        await supabase.from('profiles').upsert({
          id: user.id,
          name,
          email: user.email || '',
          avatar_url,
        });
      }
    } catch (err) {
      console.error('Error exchanging code for session:', err);
    }
  }

  // Redirect to dashboard or designated target URL
  const targetUrl = next.startsWith('/') ? `${requestUrl.origin}${next}` : next;
  return NextResponse.redirect(targetUrl);
}
