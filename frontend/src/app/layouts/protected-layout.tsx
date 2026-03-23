import { createClient } from '@/lib/client';
import { PAGES } from '@/configs/pages.config';
import type { OnboardingGetResponse } from '@/types/onboarding';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthUser } from '@/hooks/use-auth-user';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

type LayoutState = 'loading' | 'ready' | 'unauth';

export default function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: user,
    isPending: authPending,
    isError: authQueryError,
    error: authQueryErr,
  } = useAuthUser();

  const [layoutState, setLayoutState] = useState<LayoutState>('loading');
  const [onboardingFetchError, setOnboardingFetchError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function run() {
      setOnboardingFetchError(null);

      if (authPending) {
        setLayoutState('loading');
        return;
      }

      if (authQueryError) {
        console.error('auth query', authQueryErr);
        setLayoutState('unauth');
        navigate(PAGES.AUTH.LOGIN, {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      if (!user) {
        setLayoutState('unauth');
        navigate(PAGES.AUTH.LOGIN, {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      setLayoutState('loading');

      const { data, error } = await supabase.functions.invoke<OnboardingGetResponse>(
        'onboarding',
        { method: 'GET' },
      );

      if (cancelled) return;

      if (error) {
        console.error('onboarding GET', error);
        setOnboardingFetchError(
          error.message || 'Could not load team status. Try again.',
        );
        setLayoutState('ready');
        return;
      }

      const needsOnboarding = data?.needsOnboarding === true;
      const path = location.pathname;

      if (needsOnboarding && path !== PAGES.ONBOARDING) {
        navigate(PAGES.ONBOARDING, { replace: true });
        setLayoutState('ready');
        return;
      }

      if (!needsOnboarding && path === PAGES.ONBOARDING) {
        navigate(PAGES.APP.HOME, { replace: true });
        setLayoutState('ready');
        return;
      }

      setLayoutState('ready');
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    authPending,
    authQueryError,
    authQueryErr,
    user,
    location.pathname,
    navigate,
  ]);

  if (layoutState === 'loading') {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  if (layoutState === 'unauth') {
    return null;
  }

  const outletUser: User | null = user ?? null;

  return (
    <div className='flex min-h-svh flex-col'>
      <header className='border-b px-4 py-3'>
        <div className='mx-auto flex max-w-5xl items-center justify-between gap-4'>
          <Link
            to={PAGES.APP.HOME}
            className='text-sm font-medium text-foreground hover:underline'
          >
            Team app
          </Link>
          <div className='flex items-center gap-3'>
            {outletUser?.email ? (
              <span className='text-muted-foreground hidden truncate text-sm sm:inline max-w-[200px]'>
                {outletUser.email}
              </span>
            ) : null}
            <Link
              to={PAGES.AUTH.LOGOUT}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      {onboardingFetchError ? (
        <div
          className='border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive'
          role='alert'
        >
          {onboardingFetchError}
        </div>
      ) : null}

      <main className='flex-1'>
        <Outlet context={{ user: outletUser }} />
      </main>
    </div>
  );
}
