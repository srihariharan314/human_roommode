import { createBrowserClient } from '@supabase/ssr';

let isSupabaseHealthy = true;
let lastSupabaseFailure = 0;

function resilientFetch(url: any, options?: any) {
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

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXTPUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXTPUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-anon-key',
      {
        global: {
          fetch: resilientFetch,
        },
      }
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: resilientFetch,
    },
  });
}

