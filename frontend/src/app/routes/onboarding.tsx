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
import { useAuthUser } from '@/hooks/use-auth-user';
import {
  useCreateTeam,
  useJoinTeam,
  useOnboardingStatus,
} from '@/hooks/use-onboarding';
import {
  type OnboardingCreateTeamFormValues,
  onboardingCreateTeamSchema,
  type OnboardingJoinTeamFormValues,
  onboardingJoinTeamSchema,
} from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const statusQuery = useOnboardingStatus(user?.id, { enabled: Boolean(user) });

  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const [serverError, setServerError] = useState<string | null>(null);

  const createForm = useForm<OnboardingCreateTeamFormValues>({
    resolver: zodResolver(onboardingCreateTeamSchema),
    defaultValues: { teamName: '' },
  });

  const joinForm = useForm<OnboardingJoinTeamFormValues>({
    resolver: zodResolver(onboardingJoinTeamSchema),
    defaultValues: { inviteCode: '' },
  });

  useEffect(() => {
    const data = statusQuery.data;

    if (data && !data.needsOnboarding) {
      navigate(PAGES.APP.HOME, { replace: true });
    }
  }, [statusQuery.data, navigate]);

  async function onCreateTeam(values: OnboardingCreateTeamFormValues) {
    setServerError(null);
    try {
      await createTeam.mutateAsync(values.teamName);
      navigate(PAGES.APP.HOME, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  }

  async function onJoinTeam(values: OnboardingJoinTeamFormValues) {
    setServerError(null);
    try {
      await joinTeam.mutateAsync(values.inviteCode);
      navigate(PAGES.APP.HOME, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  }

  const busy = createTeam.isPending || joinTeam.isPending;

  if (statusQuery.isPending) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-muted-foreground'>Loading…</p>
      </div>
    );
  }

  if (statusQuery.isError) {
    return (
      <div className='mx-auto flex max-w-md flex-col gap-4 p-6'>
        <p className='text-destructive text-sm'>
          {statusQuery.error instanceof Error
            ? statusQuery.error.message
            : 'Could not load onboarding status.'}
        </p>
        <Button
          type='button'
          variant='outline'
          onClick={() => void statusQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='mx-auto flex max-w-md flex-col gap-8 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Create or join a team
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          You need a team before using the app.
        </p>
      </div>

      {serverError ? (
        <p className='text-destructive text-sm' role='alert'>
          {serverError}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>New team</CardTitle>

          <CardDescription>
            You&apos;ll get an invite code to share with teammates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createForm.handleSubmit(onCreateTeam)}
            className='flex flex-col gap-4'
            noValidate
          >
            <div className='grid gap-2'>
              <Label htmlFor='team-name'>Team name</Label>
              <Input
                id='team-name'
                placeholder='e.g. Acme squad'
                autoComplete='organization'
                aria-invalid={Boolean(createForm.formState.errors.teamName)}
                {...createForm.register('teamName')}
              />
              {createForm.formState.errors.teamName ? (
                <p className='text-destructive text-sm' role='alert'>
                  {createForm.formState.errors.teamName.message}
                </p>
              ) : null}
            </div>

            <Button type='submit' disabled={busy}>
              {createTeam.isPending ? 'Creating…' : 'Create team'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Have an invite code?</CardTitle>

          <CardDescription>
            Enter the code you received from a teammate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={joinForm.handleSubmit(onJoinTeam)}
            className='flex flex-col gap-4'
            noValidate
          >
            <div className='grid gap-2'>
              <Label htmlFor='invite'>Invite code</Label>
              <Input
                id='invite'
                placeholder='ABCD1234'
                autoCapitalize='characters'
                autoComplete='off'
                aria-invalid={Boolean(joinForm.formState.errors.inviteCode)}
                {...joinForm.register('inviteCode')}
              />
              {joinForm.formState.errors.inviteCode ? (
                <p className='text-destructive text-sm' role='alert'>
                  {joinForm.formState.errors.inviteCode.message}
                </p>
              ) : null}
            </div>

            <Button type='submit' variant='secondary' disabled={busy}>
              {joinTeam.isPending ? 'Joining…' : 'Join team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
