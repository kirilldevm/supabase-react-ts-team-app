import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.99.3';
import { jsonResponse } from './httpJson.ts';

/**
 * Returns the team_id for the authenticated user by querying their profile.
 * @returns `{ teamId }` on success, or `{ error: Response }` when the user has no team.
 */
export async function getUserTeamId(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ teamId: string } | { error: Response }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getUserTeamId', error);
    return { error: jsonResponse({ error: 'Failed to load team' }, 500) };
  }

  if (!data?.team_id) {
    return {
      error: jsonResponse(
        { error: 'User has no team. Complete onboarding first.' },
        403,
      ),
    };
  }

  return { teamId: data.team_id as string };
}
