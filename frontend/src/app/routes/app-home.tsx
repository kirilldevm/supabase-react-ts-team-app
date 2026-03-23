import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PAGES } from '@/configs/pages.config';
import { useTeamInfo, useTeamMembers } from '@/hooks/use-team';
import { useTeamPresence } from '@/hooks/use-team-presence';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { Check, Copy, Package, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';

type OutletCtx = { user: User };

function shortId(id: string) {
  return id.slice(0, 7);
}

function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className='flex items-center gap-2'>
      <code className='bg-muted rounded px-3 py-1.5 font-mono text-sm tracking-widest'>
        {code}
      </code>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={copy}
        aria-label='Copy invite code'
      >
        {copied ? (
          <Check className='size-3.5 text-green-600' />
        ) : (
          <Copy className='size-3.5' />
        )}
      </Button>
    </div>
  );
}

export default function AppHome() {
  const { user } = useOutletContext<OutletCtx>();

  const teamInfoQuery = useTeamInfo(user.id);
  const teamId = teamInfoQuery.data?.teams?.id;

  const membersQuery = useTeamMembers(teamId);
  const onlineMap = useTeamPresence(teamId, user);

  const team = teamInfoQuery.data?.teams;
  const members = membersQuery.data ?? [];

  return (
    <div className='mx-auto max-w-5xl space-y-6 p-6'>
      {/* ── Header ── */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {team?.name ?? 'Your workspace'}
        </h1>
        <Link
          to={PAGES.AUTH.LOGOUT}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Log out
        </Link>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* ── Team info ── */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='size-4' />
              Team
            </CardTitle>
            <CardDescription>
              Share the invite code with teammates so they can join.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {teamInfoQuery.isPending ? (
              <p className='text-muted-foreground text-sm'>Loading…</p>
            ) : teamInfoQuery.isError ? (
              <p className='text-destructive text-sm'>
                Could not load team.{' '}
                <button
                  type='button'
                  className='underline'
                  onClick={() => void teamInfoQuery.refetch()}
                >
                  Retry
                </button>
              </p>
            ) : team ? (
              <>
                <div className='grid gap-1'>
                  <span className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
                    Team name
                  </span>
                  <p className='font-medium'>{team.name}</p>
                </div>
                <div className='grid gap-1'>
                  <span className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
                    Invite code
                  </span>
                  <CopyInviteCode code={team.invite_code} />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* ── Members ── */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='size-4' />
              Members
              {members.length > 0 ? (
                <span className='text-muted-foreground text-sm font-normal'>
                  {members.length}
                </span>
              ) : null}
            </CardTitle>

            <CardDescription>
              Green dot = online (Realtime Presence).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersQuery.isPending ? (
              <p className='text-muted-foreground text-sm'>Loading…</p>
            ) : membersQuery.isError ? (
              <p className='text-destructive text-sm'>
                Could not load members.{' '}
                <button
                  type='button'
                  className='underline'
                  onClick={() => void membersQuery.refetch()}
                >
                  Retry
                </button>
              </p>
            ) : (
              <ul className='space-y-2'>
                {members.map((member) => {
                  const presence = onlineMap[member.user_id];
                  const isOnline = Boolean(presence);
                  const isMe = member.user_id === user.id;
                  const label =
                    presence?.email ??
                    member.email ??
                    (isMe
                      ? (user.email ?? `#${shortId(member.user_id)}`)
                      : `Member #${shortId(member.user_id)}`);

                  return (
                    <li
                      key={member.user_id}
                      className='flex items-center gap-2.5'
                    >
                      <span
                        className={cn(
                          'mt-0.5 size-2 shrink-0 rounded-full',
                          isOnline ? 'bg-green-500' : 'bg-muted-foreground/40',
                        )}
                        aria-label={isOnline ? 'Online' : 'Offline'}
                      />
                      <span
                        className={cn(
                          'min-w-0 truncate text-sm',
                          isMe && 'font-medium',
                        )}
                      >
                        {label}
                        {isMe && (
                          <span className='text-muted-foreground ml-1.5 text-xs'>
                            (you)
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Products (placeholder) ── */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='size-4' />
            Products
          </CardTitle>
          <CardDescription>
            Create, edit and manage your team&apos;s products. Full table coming
            next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='border-muted flex min-h-40 items-center justify-center rounded-lg border border-dashed'>
            <p className='text-muted-foreground text-sm'>
              Products table — coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
