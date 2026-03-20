import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/client';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const success = searchParams.has('success');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${origin}/auth/confirm?next=/update-password`,
      },
    );

    setLoading(false);

    if (authError) {
      setError(
        authError instanceof Error ? authError.message : 'An error occurred',
      );
      return;
    }

    navigate('/forgot-password?success', { replace: true });
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          {success ? (
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>Check Your Email</CardTitle>
                <CardDescription>
                  Password reset instructions sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  If you registered using your email and password, you will
                  receive a password reset email.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>Reset Your Password</CardTitle>
                <CardDescription>
                  Type in your email and we&apos;ll send you a link to reset
                  your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className='flex flex-col gap-6'>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        name='email'
                        type='email'
                        placeholder='m@example.com'
                        required
                      />
                    </div>
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    <Button type='submit' className='w-full' disabled={loading}>
                      {loading ? 'Sending...' : 'Send reset email'}
                    </Button>
                  </div>
                  <div className='mt-4 text-center text-sm'>
                    Already have an account?{' '}
                    <Link to='/login' className='underline underline-offset-4'>
                      Login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
