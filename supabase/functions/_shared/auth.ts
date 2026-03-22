import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';

import { corsHeaders } from './cors.ts';

export type AuthedContext = {
  user: User;
  supabase: SupabaseClient;
};

export function createSupabaseForRequest(req: Request): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const authorization = req.headers.get('Authorization') ?? '';

  return createClient(url, anonKey, {
    global: {
      headers: authorization ? { Authorization: authorization } : {},
    },
  });
}

export async function getUserFromRequest(
  req: Request,
): Promise<
  { ok: true; context: AuthedContext } | { ok: false; response: Response }
> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      ),
    };
  }

  const supabase = createSupabaseForRequest(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: error?.message ?? 'Invalid or expired session',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      ),
    };
  }

  return { ok: true, context: { user, supabase } };
}
