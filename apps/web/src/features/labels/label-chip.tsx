import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import { labelTextColor, labelTint, resolveLabelColor, type LabelLike } from './label-color';

export const labelHoverSurfaceClass =
  'bg-[color-mix(in_oklch,var(--task-label)_40%,transparent)] hover:bg-[color-mix(in_oklch,var(--task-label)_60%,transparent)]';

export function labelSurfaceStyle(color: string | null | undefined): CSSProperties {
  return { '--task-label': resolveLabelColor(color) } as CSSProperties;
}

type LabelChipProps = {
  readonly label: LabelLike;
  readonly className?: string;
};

export function LabelChip({ label, className }: LabelChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs leading-none whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: labelTint(label.color, 16), color: labelTextColor(label.color) }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: resolveLabelColor(label.color) }}
      />
      {label.name}
    </span>
  );
}

type TaskIdentityBarProps = {
  readonly color: string | null | undefined;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
};

export function TaskIdentityBar({ color, size = 'md', className }: TaskIdentityBarProps) {
  const width = size === 'sm' ? 'w-[2px]' : 'w-[5px]';

  return (
    <span
      aria-hidden="true"
      data-testid="task-identity-bar"
      className={cn(
        'pointer-events-none absolute top-1.5 bottom-1.5 left-1',
        width,
        size === 'md' && 'rounded-full',
        className,
      )}
      style={{ backgroundColor: resolveLabelColor(color) }}
    />
  );
}

type LabelDotsProps = {
  readonly labels: readonly LabelLike[] | null | undefined;
  readonly max?: number;
  readonly className?: string;
};

export function LabelDots({ labels, max = 2, className }: LabelDotsProps) {
  if (!labels || labels.length === 0) {
    return null;
  }

  const visible = labels.slice(0, max);
  const overflow = labels.length - visible.length;

  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-0.5', className)}
      data-testid="label-dots"
      aria-hidden="true"
    >
      {visible.map((label) => (
        <span
          key={label.id}
          className="size-1.5 rounded-full"
          style={{ backgroundColor: resolveLabelColor(label.color) }}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[9px] leading-none text-muted-foreground">+{overflow}</span>
      )}
    </span>
  );
}
