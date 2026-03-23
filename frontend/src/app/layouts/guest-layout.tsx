import { PAGES } from '@/configs/pages.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { Navigate, Outlet } from 'react-router';

/**
 * Login / sign-up / password screens: redirect signed-in users to the app.
 * Onboarding is enforced by ProtectedLayout on `/app`.
 */
export default function GuestLayout() {
  const { data: user, status, isError } = useAuthUser();

  if (status === 'pending') {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  if (isError) {
    return <Outlet />;
  }

  if (user) {
    return <Navigate to={PAGES.APP.HOME} replace />;
  }

  return <Outlet />;
}
