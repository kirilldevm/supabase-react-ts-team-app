import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types/product';
import type { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const STATUS_MAP: Record<
  ProductStatus,
  { variant: BadgeVariant; className: string }
> = {
  draft: {
    variant: 'outline',
    className:
      'border-yellow-400/60 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-400/30',
  },
  active: {
    variant: 'outline',
    className:
      'border-green-400/60 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-400/30',
  },
  deleted: {
    variant: 'destructive',
    className: '',
  },
};

const LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  deleted: 'Deleted',
};

type Props = { status: ProductStatus; className?: string };

export function ProductStatusBadge({ status, className }: Props) {
  const { variant, className: statusClass } = STATUS_MAP[status];
  return (
    <Badge
      variant={variant}
      className={cn(statusClass, className)}
    >
      {LABELS[status]}
    </Badge>
  );
}
