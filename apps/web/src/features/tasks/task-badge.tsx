import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui/badge';

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

export function TaskPriorityBadge({
  priority,
  className,
  ...props
}: { priority: string } & Omit<ComponentProps<typeof Badge>, 'variant'>) {
  const variant = priority === 'HIGH' ? 'danger' : priority === 'LOW' ? 'info' : 'neutral';
  return (
    <Badge variant={variant} className={className} {...props}>
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}
