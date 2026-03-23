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
  type UpdatePasswordFormValues,
  updatePasswordSchema,
} from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: UpdatePasswordFormValues) {
    setServerError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
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
              <CardTitle className='text-2xl'>Reset Your Password</CardTitle>
              <CardDescription>
                Please enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                    <Label htmlFor='password'>New password</Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='New password'
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
                  {serverError ? (
                    <p className='text-sm text-red-500' role='alert'>
                      {serverError}
                    </p>
                  ) : null}
                  <Button type='submit' className='w-full' disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save new password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
