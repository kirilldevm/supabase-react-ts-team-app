import { QUERY_KEYS } from '@/configs/query-keys.config';
import { teamService } from '@/services/team.service';
import { useQuery } from '@tanstack/react-query';

const TEAM_STALE_MS = 2 * 60 * 1000;

export function useTeamInfo(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.TEAM.INFO(userId ?? '__none__'),
    queryFn: () => teamService.getTeamInfo(userId!),
    enabled: Boolean(userId),
    staleTime: TEAM_STALE_MS,
  });
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.TEAM.MEMBERS(teamId ?? '__none__'),
    queryFn: () => teamService.getTeamMembers(teamId!),
    enabled: Boolean(teamId),
    staleTime: TEAM_STALE_MS,
  });
}
