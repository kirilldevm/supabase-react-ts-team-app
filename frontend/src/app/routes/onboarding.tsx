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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const statusQuery = useOnboardingStatus(user?.id, { enabled: Boolean(user) });

  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const data = statusQuery.data;

    if (data && !data.needsOnboarding) {
      navigate(PAGES.APP.HOME, { replace: true });
    }
  }, [statusQuery.data, navigate]);

  async function onCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await createTeam.mutateAsync(teamName.trim());
      navigate(PAGES.APP.HOME, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function onJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await joinTeam.mutateAsync(inviteCode.trim());
      navigate(PAGES.APP.HOME, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
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

      {formError ? (
        <p className='text-destructive text-sm' role='alert'>
          {formError}
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
          <form onSubmit={onCreateTeam} className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='team-name'>Team name</Label>
              <Input
                id='team-name'
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder='e.g. Acme squad'
                required
                minLength={1}
                maxLength={120}
              />
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
          <form onSubmit={onJoinTeam} className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='invite'>Invite code</Label>
              <Input
                id='invite'
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder='ABCD1234'
                required
                minLength={4}
                autoCapitalize='characters'
              />
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
