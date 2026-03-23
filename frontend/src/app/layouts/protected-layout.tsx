import { Button, buttonVariants } from '@/components/ui/button';
import { PAGES } from '@/configs/pages.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';

export default function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: user,
    status: authStatus,
    isError: authQueryError,
    error: authQueryErr,
  } = useAuthUser();

  const onboardingQuery = useOnboardingStatus(user?.id, {
    enabled: Boolean(user),
  });

  const authPending = authStatus === 'pending';

  useEffect(() => {
    if (!user) return;
    if (onboardingQuery.isPending) return;
    if (onboardingQuery.isError) return;

    const data = onboardingQuery.data;
    if (!data) return;

    const needsOnboarding = data.needsOnboarding === true;
    const path = location.pathname;

    if (needsOnboarding && path !== PAGES.ONBOARDING) {
      navigate(PAGES.ONBOARDING, { replace: true });
      return;
    }

    if (!needsOnboarding && path === PAGES.ONBOARDING) {
      navigate(PAGES.APP.HOME, { replace: true });
      return;
    }
  }, [
    user,
    onboardingQuery.isPending,
    onboardingQuery.isError,
    onboardingQuery.data,
    location.pathname,
    navigate,
  ]);

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

  if (onboardingQuery.isPending) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  const outletUser: User = user;

  const onboardingErrorMessage = onboardingQuery.isError
    ? onboardingQuery.error instanceof Error
      ? onboardingQuery.error.message
      : 'Could not load team status. Try again.'
    : null;

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

      {onboardingErrorMessage ? (
        <div
          className='border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive'
          role='alert'
        >
          {onboardingErrorMessage}
          <Button
            type='button'
            className='text-destructive ml-2 underline cursor-pointer'
            variant='ghost'
            size='xs'
            onClick={() => void onboardingQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <main className='flex-1'>
        <Outlet context={{ user: outletUser }} />
      </main>
    </div>
  );
}
