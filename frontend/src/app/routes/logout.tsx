import { createClient } from '@/lib/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  return (
    <div className='flex min-h-svh items-center justify-center'>
      <p className='text-muted-foreground'>Signing out...</p>
    </div>
  );
}
