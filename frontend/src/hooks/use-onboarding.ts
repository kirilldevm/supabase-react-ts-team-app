import { QUERY_KEYS } from '@/configs/query-keys.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { onboardingService } from '@/services/onboarding.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const ONBOARDING_STATUS_STALE_MS = 60 * 1000;

type UseOnboardingStatusOptions = {
  enabled?: boolean;
};

export function useOnboardingStatus(
  userId: string | undefined,
  options: UseOnboardingStatusOptions = {},
) {
  const enabled =
    (options.enabled ?? true) &&
    typeof userId === 'string' &&
    userId.length > 0;

  return useQuery({
    queryKey: QUERY_KEYS.ONBOARDING.STATUS(userId ?? '__none__'),
    queryFn: () => onboardingService.getStatus(),
    enabled,
    staleTime: ONBOARDING_STATUS_STALE_MS,
  });
}

function useInvalidateOnboardingStatus() {
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser();

  return async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ONBOARDING.STATUS(user.id),
      });
    } else {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ONBOARDING.ALL,
      });
    }
  };
}

export function useCreateTeam() {
  const invalidate = useInvalidateOnboardingStatus();

  return useMutation({
    mutationFn: (teamName: string) => onboardingService.createTeam(teamName),
    onSuccess: () => {
      void invalidate();
    },
  });
}

export function useJoinTeam() {
  const invalidate = useInvalidateOnboardingStatus();

  return useMutation({
    mutationFn: (inviteCode: string) => onboardingService.joinTeam(inviteCode),
    onSuccess: () => {
      void invalidate();
    },
  });
}
