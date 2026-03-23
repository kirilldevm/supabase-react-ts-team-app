/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  /** Legacy anon JWT (`eyJ...`) — use for Edge Functions + apikey compatibility */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** New publishable key (`sb_publishable_...`) — ok for many APIs; pair with ANON_KEY for functions */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
