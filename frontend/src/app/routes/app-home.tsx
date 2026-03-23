import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PAGES } from '@/configs/pages.config'
import type { User } from '@supabase/supabase-js'
import { Link, useOutletContext } from 'react-router'

type OutletCtx = { user: User | null };

export default function AppHome() {
  const { user } = useOutletContext<OutletCtx>();

  return (
    <div className='mx-auto max-w-lg p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Home</CardTitle>
          <CardDescription>
            You&apos;re signed in and on a team. Build products and team
            features here.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <p className='text-sm'>
            Signed in as{' '}
            <span className='font-medium text-foreground'>
              {user?.email ?? '—'}
            </span>
          </p>
          <Link
            to={PAGES.AUTH.LOGOUT}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Log out
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
