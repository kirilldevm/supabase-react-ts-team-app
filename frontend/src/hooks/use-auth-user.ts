import { QUERY_KEYS } from '@/configs/query-keys.config';
import { authService } from '@/services/auth.service';
import type { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

/** How long the auth user is treated as fresh (see TanStack `staleTime`). */
const AUTH_USER_STALE_MS = 5 * 60 * 1000;

type UseAuthUserOptions = {
  /** When false, does not fetch (e.g. on public routes). Default true. */
  enabled?: boolean;
};

/**
 * Current Supabase user in the React Query cache, updated by `AuthCacheSync`
 * (`components/auth-cache-sync.tsx`) and this hook’s `queryFn`.
 */
export function useAuthUser(options: UseAuthUserOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: QUERY_KEYS.AUTH.USER(),
    queryFn: () => authService.getUser(),
    staleTime: AUTH_USER_STALE_MS,
    enabled,
  });
}

export type AuthUserQuery = ReturnType<typeof useAuthUser>;
export type AuthUserData = User | null;
