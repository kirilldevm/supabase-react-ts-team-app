import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type { ProductStatus } from '@/types/product';
import type { TeamMember } from '@/types/team';
import { Search } from 'lucide-react';

const STATUS_LABELS: Record<ProductStatus | '', string> = {
  '': 'All statuses',
  draft: 'Draft',
  active: 'Active',
  deleted: 'Deleted',
};

const ALL_MEMBERS = '__all__';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;

  status: ProductStatus | '';
  onStatusChange: (v: ProductStatus | '') => void;

  createdBy: string;
  onCreatedByChange: (v: string) => void;

  members: TeamMember[];
  currentUserId: string;

  hasFilters: boolean;
  onClearFilters: () => void;
};

export function ProductsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  createdBy,
  onCreatedByChange,
  members,
  currentUserId,
  hasFilters,
  onClearFilters,
}: Props) {
  const createdByMember = members.find((m) => m.user_id === createdBy);
  const createdByLabel = createdBy
    ? createdBy === currentUserId
      ? 'You'
      : (createdByMember?.email ?? createdBy.slice(0, 8) ?? '')
    : 'All members';

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        {/* Search */}
        <div className='relative min-w-40 flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
          <Input
            placeholder='Search products…'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-8'
          />
        </div>

        {/* Status filter */}
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as ProductStatus | '')}
        >
          <SelectTrigger aria-label='Filter by status'>
            <span className='flex flex-1 text-left text-sm'>
              {STATUS_LABELS[status]}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All statuses</SelectItem>
            <SelectItem value='draft'>Draft</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='deleted'>Deleted</SelectItem>
          </SelectContent>
        </Select>

        {/* Created by filter */}
        <Select
          value={createdBy || ALL_MEMBERS}
          onValueChange={(v) =>
            onCreatedByChange(v === ALL_MEMBERS ? '' : (v ?? ''))
          }
        >
          <SelectTrigger aria-label='Filter by creator'>
            <span className='flex flex-1 text-left text-sm'>
              {createdByLabel}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MEMBERS}>All members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.user_id === currentUserId
                  ? 'You'
                  : (m.email ?? m.user_id.slice(0, 8))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col flex-wrap items-center gap-2'>
        {hasFilters && (
          <Button
            type='button'
            variant='ghost'
            size='lg'
            className='flex-1 w-full min-h-8'
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
