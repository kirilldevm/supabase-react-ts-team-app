import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { useProducts } from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import type { Product, ProductSortBy, ProductSortOrder, ProductStatus } from '@/types/product';
import type { TeamMember } from '@/types/team';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ProductStatusBadge } from './product-status-badge';
import { ProductsFilterBar } from './products-filter-bar';

const PAGE_SIZE = 10;
const SKELETON_WIDTHS = ['w-3/5', 'w-1/6', 'w-1/3', 'w-1/4', 'w-1/4'] as const;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function getMemberLabel(userId: string, members: TeamMember[], currentUserId: string) {
  if (userId === currentUserId) return 'You';
  const m = members.find((x) => x.user_id === userId);
  return m?.email ?? `${userId.slice(0, 8)}…`;
}

// ── Sortable column header ─────────────────────────────────────────────────
function SortHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: ProductSortBy;
  label: string;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
  onSort: (col: ProductSortBy) => void;
}) {
  const active = sortBy === column;
  return (
    <button
      type='button'
      onClick={() => onSort(column)}
      className={cn(
        'flex items-center gap-1 whitespace-nowrap font-medium transition-colors hover:text-foreground',
        active ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {label}
      {active ? (
        sortOrder === 'asc' ? (
          <ArrowUp className='size-3' />
        ) : (
          <ArrowDown className='size-3' />
        )
      ) : (
        <ArrowUpDown className='size-3 opacity-40' />
      )}
    </button>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {SKELETON_WIDTHS.map((w, i) => (
        <TableCell key={i}>
          <div className={cn('h-4 animate-pulse rounded bg-muted', w)} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────
type Props = {
  teamId: string;
  members: TeamMember[];
  currentUserId: string;
};

export function ProductsTable({ teamId, members, currentUserId }: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [createdBy, setCreatedBy] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('desc');
  const [page, setPage] = useState(1);

  const search = useDebounce(searchInput, 350);

  function withPageReset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(1);
      setter(v);
    };
  }

  function handleSort(col: ProductSortBy) {
    if (col === sortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  }

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(createdBy ? { createdBy } : {}),
    sortBy,
    sortOrder,
  };

  const { data, isPending, isError, refetch } = useProducts(teamId, params);

  const products: Product[] = data?.products ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const hasFilters = Boolean(status || search || createdBy);

  function clearFilters() {
    setPage(1);
    setSearchInput('');
    setStatus('');
    setCreatedBy('');
  }

  return (
    <div className='flex flex-col gap-3'>
      <ProductsFilterBar
        search={searchInput}
        onSearchChange={(v) => { setPage(1); setSearchInput(v); }}
        status={status}
        onStatusChange={withPageReset(setStatus)}
        createdBy={createdBy}
        onCreatedByChange={withPageReset(setCreatedBy)}
        members={members}
        currentUserId={currentUserId}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      <div className='rounded-lg border border-border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>
                <SortHeader
                  column='created_at'
                  label='Created'
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  column='updated_at'
                  label='Updated'
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className='py-10 text-center'>
                  <p className='text-destructive text-sm'>
                    Could not load products.{' '}
                    <button
                      type='button'
                      className='underline'
                      onClick={() => void refetch()}
                    >
                      Retry
                    </button>
                  </p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='py-10 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    {hasFilters
                      ? 'No products match the current filters.'
                      : 'No products yet. Create the first one!'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className='max-w-xs whitespace-normal'>
                    <p className='truncate font-medium'>{product.title}</p>
                    {product.description ? (
                      <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                        {product.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {getMemberLabel(product.created_by, members, currentUserId)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDate(product.created_at)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDate(product.updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {!isPending && !isError && total > 0 && (
        <div className='flex items-center justify-between gap-4'>
          <p className='text-muted-foreground text-xs'>
            {total === 1
              ? '1 product'
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>

          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label='Previous page'
            >
              <ChevronLeft className='size-3.5' />
            </Button>

            <span className='text-muted-foreground min-w-20 text-center text-xs'>
              Page {page} of {totalPages}
            </span>

            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label='Next page'
            >
              <ChevronRight className='size-3.5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
