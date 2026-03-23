import { supabase } from '@/lib/client';
import type { ProfileWithTeam, Team, TeamMember } from '@/types/team';
import type { SupabaseClient } from '@supabase/supabase-js';

class TeamService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getTeamInfo(userId: string): Promise<ProfileWithTeam> {
    const { data, error } = await this.client
      .from('profiles')
      .select('team_id, joined_at, teams(id, name, invite_code, created_at)')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Team not found');

    return data as unknown as ProfileWithTeam;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('user_id, joined_at, email')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as TeamMember[];
  }

  async getTeam(teamId: string): Promise<Team> {
    const { data, error } = await this.client
      .from('teams')
      .select('id, name, invite_code, created_at')
      .eq('id', teamId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Team not found');

    return data as Team;
  }
}

export const teamService = new TeamService(supabase);
