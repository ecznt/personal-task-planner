import type * as React from 'react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'card-surface flex flex-col items-center gap-4 rounded-xl border border-border/70 bg-card px-6 py-10 text-center shadow-surface',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground shadow-inner-edge ring-1 ring-border">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
