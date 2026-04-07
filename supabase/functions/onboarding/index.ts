import { Hono } from 'jsr:@hono/hono';
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2.99.3';
import { z } from 'npm:zod';

import { createSupabaseForRequest } from '../_shared/auth.ts';
import { createServiceClient } from '../_shared/supabaseAdmin.ts';

// ── Types ─────────────────────────────────────────────────────────────────

type TeamSummary = {
  id: string;
  name: string;
  invite_code: string;
};

type Env = {
  Variables: {
    user: User;
    supabase: SupabaseClient;
  };
};

// ── Validation schemas ────────────────────────────────────────────────────

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Team name is required')
    .max(120, 'Team name must be at most 120 characters'),
});

const joinTeamSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, 'Invite code is too short')
    .max(20, 'Invite code is too long'),
});

// ── Helper ────────────────────────────────────────────────────────────────

async function loadProfileWithTeam(
  admin: SupabaseClient,
  userId: string,
): Promise<{ team: TeamSummary } | null> {
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (pErr) {
    console.error('loadProfileWithTeam profile', pErr);
    return null;
  }

  if (!profile?.team_id) return null;

  const { data: team, error: tErr } = await admin
    .from('teams')
    .select('id, name, invite_code')
    .eq('id', profile.team_id)
    .maybeSingle();

  if (tErr || !team) {
    console.error('loadProfileWithTeam team', tErr);
    return null;
  }

  return { team: team as TeamSummary };
}

// ── App ───────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const app = new Hono<Env>();

app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const supabase = createSupabaseForRequest(c.req.raw);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json(
      {
        error: 'Unauthorized',
        message: error?.message ?? 'Invalid or expired session',
      },
      401,
    );
  }

  c.set('user', user);
  c.set('supabase', supabase);
  await next();
});

// ── GET /onboarding ───────────────────────────────────────────────────────

app.get('/onboarding', async (c) => {
  const user = c.get('user');
  const admin = createServiceClient();

  const row = await loadProfileWithTeam(admin, user.id);

  if (!row) {
    return c.json({ needsOnboarding: true, team: null });
  }

  return c.json({ needsOnboarding: false, team: row.team });
});

// ── POST /onboarding/team — create a new team ─────────────────────────────

app.post('/onboarding/team', async (c) => {
  const user = c.get('user');
  const admin = createServiceClient();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const { name } = parsed.data;

  const existing = await loadProfileWithTeam(admin, user.id);
  if (existing) {
    return c.json(
      {
        error: 'Already in a team',
        code: 'already_onboarded',
        team: existing.team,
      },
      409,
    );
  }

  const { data: team, error: teamErr } = await admin
    .from('teams')
    .insert({ name })
    .select('id, name, invite_code')
    .single();

  if (teamErr || !team) {
    console.error('create team', teamErr);
    return c.json({ error: 'Failed to create team' }, 500);
  }

  const { error: profErr } = await admin
    .from('profiles')
    .insert({ user_id: user.id, team_id: team.id });

  if (profErr) {
    console.error('create profile after team', profErr);
    // Best-effort cleanup to avoid orphan team
    await admin.from('teams').delete().eq('id', team.id);
    return c.json({ error: 'Failed to create profile' }, 500);
  }

  return c.json({ ok: true, team: team as TeamSummary }, 201);
});

// ── POST /onboarding/join — join an existing team ─────────────────────────

app.post('/onboarding/join', async (c) => {
  const user = c.get('user');
  const admin = createServiceClient();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = joinTeamSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const code = parsed.data.inviteCode.toUpperCase();

  const existing = await loadProfileWithTeam(admin, user.id);
  if (existing) {
    return c.json(
      {
        error: 'Already in a team',
        code: 'already_onboarded',
        team: existing.team,
      },
      409,
    );
  }

  const { data: team, error: findErr } = await admin
    .from('teams')
    .select('id, name, invite_code')
    .eq('invite_code', code)
    .maybeSingle();

  if (findErr) {
    console.error('find team by code', findErr);
    return c.json({ error: 'Failed to look up team' }, 500);
  }

  if (!team) {
    return c.json(
      { error: 'Invalid invite code', code: 'invalid_invite' },
      404,
    );
  }

  const { error: joinErr } = await admin
    .from('profiles')
    .insert({ user_id: user.id, team_id: team.id });

  if (joinErr) {
    if (joinErr.code === '23505') {
      return c.json(
        { error: 'Already in a team', code: 'already_onboarded' },
        409,
      );
    }
    console.error('join team insert profile', joinErr);
    return c.json({ error: 'Failed to join team' }, 500);
  }

  return c.json({ ok: true, team: team as TeamSummary });
});

// ── Serve ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const res = await app.fetch(req);
  const headers = new Headers(res.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
