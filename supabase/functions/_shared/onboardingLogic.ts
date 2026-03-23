import type { SupabaseClient } from '@supabase/supabase-js';

import { jsonResponse } from './httpJson.ts';

const MAX_TEAM_NAME_LEN = 120;

export type TeamSummary = {
  id: string;
  name: string;
  invite_code: string;
};

function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

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

export async function handleOnboardingGet(
  admin: SupabaseClient,
  userId: string,
): Promise<Response> {
  const row = await loadProfileWithTeam(admin, userId);

  if (!row) {
    return jsonResponse({ needsOnboarding: true, team: null });
  }

  return jsonResponse({
    needsOnboarding: false,
    team: row.team,
  });
}

type PostBody = {
  action?: string;
  teamName?: string;
  inviteCode?: string;
};

export async function handleOnboardingPost(
  admin: SupabaseClient,
  userId: string,
  body: unknown,
): Promise<Response> {
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { action, teamName, inviteCode } = body as PostBody;

  if (action !== 'create_team' && action !== 'join_team') {
    return jsonResponse(
      {
        error: 'Invalid action',
        expected: ['create_team', 'join_team'],
      },
      400,
    );
  }

  const existing = await loadProfileWithTeam(admin, userId);
  if (existing) {
    return jsonResponse(
      {
        error: 'Already in a team',
        code: 'already_onboarded',
        team: existing.team,
      },
      409,
    );
  }

  if (action === 'create_team') {
    if (typeof teamName !== 'string' || !teamName.trim()) {
      return jsonResponse({ error: 'teamName is required (non-empty string)' }, 400);
    }

    const name = teamName.trim();
    if (name.length > MAX_TEAM_NAME_LEN) {
      return jsonResponse(
        { error: `teamName must be at most ${MAX_TEAM_NAME_LEN} characters` },
        400,
      );
    }

    const { data: team, error: teamErr } = await admin
      .from('teams')
      .insert({ name })
      .select('id, name, invite_code')
      .single();

    if (teamErr || !team) {
      console.error('create team', teamErr);
      return jsonResponse({ error: 'Failed to create team' }, 500);
    }

    const { error: profErr } = await admin.from('profiles').insert({
      user_id: userId,
      team_id: team.id,
    });

    if (profErr) {
      console.error('create profile after team', profErr);
      // Best-effort cleanup (avoid orphan team if possible)
      await admin.from('teams').delete().eq('id', team.id);
      return jsonResponse({ error: 'Failed to create profile' }, 500);
    }

    return jsonResponse({
      ok: true,
      action: 'create_team',
      team: team as TeamSummary,
    });
  }

  // join_team
  if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return jsonResponse({ error: 'inviteCode is required (non-empty string)' }, 400);
  }

  const code = normalizeInviteCode(inviteCode);
  if (code.length < 4) {
    return jsonResponse({ error: 'inviteCode is too short' }, 400);
  }

  const { data: team, error: findErr } = await admin
    .from('teams')
    .select('id, name, invite_code')
    .eq('invite_code', code)
    .maybeSingle();

  if (findErr) {
    console.error('find team by code', findErr);
    return jsonResponse({ error: 'Failed to look up team' }, 500);
  }

  if (!team) {
    return jsonResponse({ error: 'Invalid invite code', code: 'invalid_invite' }, 404);
  }

  const { error: joinErr } = await admin.from('profiles').insert({
    user_id: userId,
    team_id: team.id,
  });

  if (joinErr) {
    if (joinErr.code === '23505') {
      return jsonResponse(
        { error: 'Already in a team', code: 'already_onboarded' },
        409,
      );
    }
    console.error('join team insert profile', joinErr);
    return jsonResponse({ error: 'Failed to join team' }, 500);
  }

  return jsonResponse({
    ok: true,
    action: 'join_team',
    team: team as TeamSummary,
  });
}
