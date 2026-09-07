import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ListSkeletonProps = {
  readonly rows?: number;
  readonly className?: string;
};

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}
