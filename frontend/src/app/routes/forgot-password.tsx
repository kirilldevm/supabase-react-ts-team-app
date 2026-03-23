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
import { PAGES } from '@/configs/pages.config';
import { createClient } from '@/lib/client';
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const success = searchParams.has('success');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      values.email,
      {
        redirectTo: `${origin}${PAGES.AUTH.AUTH_CONFIRM}?next=${encodeURIComponent(PAGES.AUTH.UPDATE_PASSWORD)}`,
      },
    );

    if (authError) {
      setServerError(
        authError instanceof Error ? authError.message : 'An error occurred',
      );
      return;
    }

    navigate(`${PAGES.AUTH.FORGOT_PASSWORD}?success`, { replace: true });
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
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className='flex flex-col gap-6'>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='m@example.com'
                        autoComplete='email'
                        aria-invalid={Boolean(errors.email)}
                        {...register('email')}
                      />
                      {errors.email ? (
                        <p className='text-destructive text-sm' role='alert'>
                          {errors.email.message}
                        </p>
                      ) : null}
                    </div>
                    {serverError ? (
                      <p className='text-sm text-red-500' role='alert'>
                        {serverError}
                      </p>
                    ) : null}
                    <Button type='submit' className='w-full' disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send reset email'}
                    </Button>
                  </div>
                  <div className='mt-4 text-center text-sm'>
                    Already have an account?{' '}
                    <Link
                      to={PAGES.AUTH.LOGIN}
                      className='underline underline-offset-4'
                    >
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
