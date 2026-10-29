import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

let isSupabaseHealthy = true;
let lastSupabaseFailure = 0;

function resilientFetch(url: any, options?: any) {
  // If Supabase failed recently (within 60s), fail fast without retrying
  if (!isSupabaseHealthy && Date.now() - lastSupabaseFailure < 60000) {
    return Promise.resolve(new Response(JSON.stringify({ message: 'Supabase unreachable' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  return fetch(url, {
    ...options,
    signal: options?.signal || controller.signal,
  })
    .then((res) => {
      isSupabaseHealthy = true;
      return res;
    })
    .catch(() => {
      isSupabaseHealthy = false;
      lastSupabaseFailure = Date.now();
      return new Response(JSON.stringify({ message: 'Supabase unreachable' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXTPUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXTPUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: resilientFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

// Service role client for privileged backend tasks (e.g. saving AI results)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXTPUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXTPUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-key';

  return createServerClient(supabaseUrl, serviceKey, {
    global: {
      fetch: resilientFetch,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

