import { buttonVariants } from '@/components/ui/button';
import { PAGES } from '@/configs/pages.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { supabase } from '@/lib/client';
import { cn } from '@/lib/utils';
import type { OnboardingGetResponse } from '@/types/onboarding';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';

type ShellState = 'checking' | 'ready';

export default function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: user,
    status: authStatus,
    isError: authQueryError,
    error: authQueryErr,
  } = useAuthUser();

  const [shellState, setShellState] = useState<ShellState>('checking');
  const [onboardingFetchError, setOnboardingFetchError] = useState<
    string | null
  >(null);

  const authPending = authStatus === 'pending';

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setOnboardingFetchError(null);

      if (authPending || authQueryError) {
        setShellState('checking');
        return;
      }

      if (!user) {
        setShellState('checking');
        return;
      }

      setShellState('checking');

      const { data, error } =
        await supabase.functions.invoke<OnboardingGetResponse>('onboarding', {
          method: 'GET',
        });

      if (cancelled) return;

      if (error) {
        console.error('onboarding GET', error);
        setOnboardingFetchError(
          error.message || 'Could not load team status. Try again.',
        );
        setShellState('ready');
        return;
      }

      const needsOnboarding = data?.needsOnboarding === true;
      const path = location.pathname;

      if (needsOnboarding && path !== PAGES.ONBOARDING) {
        navigate(PAGES.ONBOARDING, { replace: true });
        setShellState('ready');
        return;
      }

      if (!needsOnboarding && path === PAGES.ONBOARDING) {
        navigate(PAGES.APP.HOME, { replace: true });
        setShellState('ready');
        return;
      }

      setShellState('ready');
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [authPending, authQueryError, user, location.pathname, navigate]);

  if (authPending) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  if (authQueryError) {
    console.error('auth query', authQueryErr);
    return (
      <Navigate
        to={PAGES.AUTH.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to={PAGES.AUTH.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (shellState === 'checking') {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  const outletUser: User = user;

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
            {outletUser.email ? (
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
