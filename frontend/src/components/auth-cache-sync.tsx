import { QUERY_KEYS } from '@/configs/query-keys.config';
import { authService } from '@/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Keeps `QUERY_KEYS.AUTH.USER()` in sync with Supabase. Mount once inside
 * `QueryClientProvider` (e.g. next to the router).
 */
export function AuthCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = authService.getClient();

    void (async () => {
      const user = await authService.getUser();
      queryClient.setQueryData(QUERY_KEYS.AUTH.USER(), user);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH.USER(), session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return null;
}
