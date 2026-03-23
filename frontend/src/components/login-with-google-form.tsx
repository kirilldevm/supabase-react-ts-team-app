'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/client';
import { cn } from '@/lib/utils';

export function LoginWithOAuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSocialLogin}>
        <div className='flex flex-col gap-6'>
          {error && <p className='text-sm text-destructive-500'>{error}</p>}
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Continue with Google'}
          </Button>
        </div>
      </form>
    </div>
  );
}
