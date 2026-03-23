import { LoginWithOAuthForm } from '@/components/login-with-google-form';
import Separator from '@/components/shared/separator';
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
import { type LoginFormValues, loginSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (authError) {
      setServerError(
        authError instanceof Error ? authError.message : 'An error occurred',
      );
      return;
    }

    navigate(PAGES.APP.HOME, { replace: true });
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl text-center mb-2'>Login</CardTitle>

              <LoginWithOAuthForm />

              <Separator />

              <CardDescription>
                Enter your email below to login to your account
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
                  <div className='grid gap-2'>
                    <div className='flex items-center'>
                      <Label htmlFor='password'>Password</Label>
                      <Link
                        to={PAGES.AUTH.FORGOT_PASSWORD}
                        className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id='password'
                      type='password'
                      autoComplete='current-password'
                      aria-invalid={Boolean(errors.password)}
                      {...register('password')}
                    />
                    {errors.password ? (
                      <p className='text-destructive text-sm' role='alert'>
                        {errors.password.message}
                      </p>
                    ) : null}
                  </div>
                  {serverError ? (
                    <p className='text-sm text-red-500' role='alert'>
                      {serverError}
                    </p>
                  ) : null}
                  <Button type='submit' className='w-full' disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
                <div className='mt-4 text-center text-sm'>
                  Don&apos;t have an account?{' '}
                  <Link
                    to={PAGES.AUTH.SIGN_UP}
                    className='underline underline-offset-4'
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
