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
import { supabase } from '@/lib/client';
import { type SignUpFormValues, signUpSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const success = searchParams.has('success');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      repeatPassword: '',
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    setServerError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(PAGES.APP.HOME)}`,
      },
    });

    if (authError) {
      setServerError(authError.message);
      return;
    }

    navigate(`${PAGES.AUTH.SIGN_UP}?success`, { replace: true });
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          {success ? (
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>
                  Thank you for signing up!
                </CardTitle>
                <CardDescription>Check your email to confirm</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  You&apos;ve successfully signed up. Please check your email to
                  confirm your account before signing in.
                </p>
                <Button onClick={() => navigate(PAGES.AUTH.LOGIN)}>
                  Login
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl text-center mb-2'>
                  Sign up
                </CardTitle>

                <LoginWithOAuthForm />

                <Separator />

                <CardDescription>Create a new account</CardDescription>
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
                      <Label htmlFor='password'>Password</Label>
                      <Input
                        id='password'
                        type='password'
                        autoComplete='new-password'
                        aria-invalid={Boolean(errors.password)}
                        {...register('password')}
                      />
                      {errors.password ? (
                        <p className='text-destructive text-sm' role='alert'>
                          {errors.password.message}
                        </p>
                      ) : null}
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='repeat-password'>Repeat Password</Label>
                      <Input
                        id='repeat-password'
                        type='password'
                        autoComplete='new-password'
                        aria-invalid={Boolean(errors.repeatPassword)}
                        {...register('repeatPassword')}
                      />
                      {errors.repeatPassword ? (
                        <p className='text-destructive text-sm' role='alert'>
                          {errors.repeatPassword.message}
                        </p>
                      ) : null}
                    </div>
                    {serverError ? (
                      <p className='text-sm text-red-500' role='alert'>
                        {serverError}
                      </p>
                    ) : null}
                    <Button
                      type='submit'
                      className='w-full'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating an account...' : 'Sign up'}
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
