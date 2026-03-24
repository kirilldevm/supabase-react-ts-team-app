import { ProductStatusBadge } from '@/components/products/product-status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAGES } from '@/configs/pages.config';
import { useTeamInfo, useTeamMembers } from '@/hooks/use-team';
import {
  useProduct,
  useProductImages,
  useUpdateProductStatus,
} from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  CalendarDays,
  ImageOff,
  Loader2,
  Package,
  Trash2,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router';

type OutletCtx = { user: User };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletCtx>();

  const teamInfoQuery = useTeamInfo(user.id);
  const teamId = teamInfoQuery.data?.teams?.id;
  const membersQuery = useTeamMembers(teamId);
  const members = membersQuery.data ?? [];

  const { data: product, isPending, isError, error } = useProduct(id);

  const { data: imagesMap, isPending: isLoadingImage } = useProductImages(
    product ? [product] : [],
  );
  const imageUrl = product?.image_url
    ? (imagesMap?.get(product.image_url) ?? null)
    : null;

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProductStatus();

  function getMemberLabel(userId: string) {
    if (userId === user.id) return 'You';
    const m = members.find((x) => x.user_id === userId);
    return m?.email ?? `${userId.slice(0, 8)}…`;
  }

  function handleActivate() {
    if (!product) return;
    updateStatus(
      { productId: product.id, status: 'active' },
      { onSuccess: (updated) => navigate(PAGES.APP.PRODUCT(updated.id)) },
    );
  }

  function handleDelete() {
    if (!product) return;
    updateStatus(
      { productId: product.id, status: 'deleted' },
      { onSuccess: () => navigate(PAGES.APP.HOME) },
    );
  }

  return (
    <div className='mx-auto max-w-3xl space-y-4 p-6'>
      <div className='flex items-center gap-3'>
        <Link
          to={PAGES.APP.HOME}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2',
          )}
        >
          <ArrowLeft className='size-4' />
          Products
        </Link>
      </div>

      {isPending ? (
        <div className='flex min-h-48 items-center justify-center'>
          <Loader2 className='text-muted-foreground size-6 animate-spin' />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <p className='text-destructive text-sm'>
              {error instanceof Error
                ? error.message
                : 'Could not load product.'}
            </p>
            <Link
              to={PAGES.APP.HOME}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'mt-4',
              )}
            >
              Back to products
            </Link>
          </CardContent>
        </Card>
      ) : product ? (
        <>
          {/* ── Image ── */}
          {product.image_url ? (
            <div className='overflow-hidden rounded-xl border border-border bg-muted'>
              {isLoadingImage || !imageUrl ? (
                <div className='flex h-64 items-center justify-center'>
                  <Loader2 className='text-muted-foreground size-6 animate-spin' />
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className='h-64 w-full object-contain'
                />
              )}
            </div>
          ) : (
            <div className='flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40'>
              <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                <ImageOff className='size-8 opacity-40' />
                <span className='text-sm'>No image</span>
              </div>
            </div>
          )}

          {/* ── Main card ── */}
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between gap-4'>
                <CardTitle className='flex items-center gap-2 text-xl leading-snug'>
                  <Package className='mt-0.5 size-5 shrink-0 text-muted-foreground' />
                  {product.title}
                </CardTitle>
                <ProductStatusBadge status={product.status} />
              </div>
            </CardHeader>

            <CardContent className='space-y-5'>
              {product.description ? (
                <p className='text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap'>
                  {product.description}
                </p>
              ) : (
                <p className='text-sm italic text-muted-foreground/60'>
                  No description.
                </p>
              )}

              {/* ── Metadata ── */}
              <div className='grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2'>
                <div className='flex items-start gap-2'>
                  <UserIcon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />

                  <div>
                    <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Created by
                    </p>
                    <p>{getMemberLabel(product.created_by)}</p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <CalendarDays className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  <div>
                    <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Created
                    </p>
                    <p>{formatDate(product.created_at)}</p>
                  </div>
                </div>

                <div className='flex items-start gap-2 sm:col-start-2'>
                  <CalendarDays className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  <div>
                    <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Last updated
                    </p>
                    <p>{formatDate(product.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* ── Actions ── */}
              {product.status !== 'deleted' && (
                <div className='flex flex-wrap items-center gap-2 border-t border-border pt-4'>
                  {product.status === 'draft' && (
                    <Button
                      variant='default'
                      size='sm'
                      disabled={isUpdatingStatus}
                      onClick={handleActivate}
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className='size-3.5 animate-spin' />
                      ) : (
                        <Zap className='size-3.5' />
                      )}
                      Activate
                    </Button>
                  )}
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={isUpdatingStatus}
                    onClick={handleDelete}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className='size-3.5 animate-spin' />
                    ) : (
                      <Trash2 className='size-3.5' />
                    )}
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
