import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

/**
 * Public key sent as `apikey` (and as Bearer fallback when no session).
 * Prefer legacy **anon JWT** (`eyJ...`): Edge Function gateway + `sb_publishable_*` often
 * return 401 Invalid JWT. See https://supabase.com/docs/guides/troubleshooting/edge-function-401-error-response
 */
function getBrowserSupabaseKey(): string {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const key = anon || publishable;
  if (!key) {
    throw new Error(
      'Set VITE_SUPABASE_ANON_KEY (recommended, eyJ...) or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
    );
  }
  return key;
}

let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('Set VITE_SUPABASE_URL in .env.local');
  }

  if (typeof window === 'undefined') {
    return createSupabaseClient(url, getBrowserSupabaseKey(), {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(url, getBrowserSupabaseKey(), {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
  }

  return browserClient;
}

export const supabase = createClient();
