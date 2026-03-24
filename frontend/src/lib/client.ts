import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishable) {
    throw new Error('Set VITE_SUPABASE_URL in .env.local');
  }

  if (typeof window === 'undefined') {
    return createSupabaseClient(url, publishable);
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(url, publishable);
  }

  return browserClient;
}

export const supabase = createClient();
