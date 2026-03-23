import { PAGES } from '@/configs/pages.config';
import { createClient } from '@/lib/client';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

function pkceLockKey(code: string): string {
  return `sb:pkce-lock:${code}`;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        navigate(PAGES.APP.HOME, { replace: true });
        return;
      }

      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const lock = pkceLockKey(code);
        if (sessionStorage.getItem(lock)) {
          // Strict Mode 2nd effect: wait for the 1st effect’s exchange to finish
          for (let i = 0; i < 60; i++) {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              navigate(PAGES.APP.HOME, { replace: true });
              return;
            }
            await new Promise((r) => setTimeout(r, 50));
          }
          return;
        }
        sessionStorage.setItem(lock, '1');

        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (error) {
          sessionStorage.removeItem(lock);
          navigate(`/auth/error?error=${encodeURIComponent(error.message)}`, {
            replace: true,
          });
          return;
        }
        navigate(PAGES.APP.HOME, { replace: true });
        return;
      }

      const { data: after } = await supabase.auth.getSession();
      if (after.session) {
        navigate(PAGES.APP.HOME, { replace: true });
        return;
      }

      setMessage('Missing authorization code. Try signing in again.');
    })();
  }, [navigate]);

  return (
    <div className='flex min-h-svh items-center justify-center p-6'>
      <p className='text-muted-foreground'>{message}</p>
    </div>
  );
}
