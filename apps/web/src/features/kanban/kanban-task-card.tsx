'use client';

import { CalendarClock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { LabelChip } from '@/features/labels/label-chip';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';

export type KanbanTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly version: number;
  readonly labels: readonly { readonly id: string; readonly name: string; readonly color: string | null }[];
  readonly project: { readonly id: string; readonly name: string } | null;
  readonly areaName?: string;
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function KanbanTaskCard({ task, index }: { task: KanbanTask; index?: number }) {
  return (
    <div
      className="card-surface rounded-lg border border-border/70 bg-card p-3 shadow-surface transition-all duration-150 hover:border-border hover:shadow-surface-hover"
      style={index === undefined ? undefined : { animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="truncate text-sm font-medium">{task.title}</div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        {task.project && <Badge variant="primary">{task.project.name}</Badge>}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {(task.labels ?? []).map((label) => (
          <LabelChip key={label.id} label={label} />
        ))}
        {task.areaName !== undefined && task.areaName.length > 0 && (
          <span className="text-xs text-muted-foreground">{task.areaName}</span>
        )}
        {task.plannedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {formatShortDate(task.plannedAt)}
          </span>
        )}
        {task.dueAt && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="size-3" aria-hidden="true" />
            {formatShortDate(task.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}
