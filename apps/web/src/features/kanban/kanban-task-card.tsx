'use client';

import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { CalendarClock, ListTree, Lock } from 'lucide-react';
import { anchorLabel } from '@/features/labels/label-color';
import { Badge } from '@/components/ui/badge';
import {
  LabelChip,
  TaskIdentityBar,
  labelHoverSurfaceClass,
  labelSurfaceStyle,
} from '@/features/labels/label-chip';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { SubtaskProgress } from '@/features/tasks/subtask-progress';

export type KanbanTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly version: number;
  readonly parentTaskId: string | null;
  readonly subtaskCount: number;
  readonly completedSubtaskCount: number;
  readonly isBlocked?: boolean;
  readonly blockedByTasks?: readonly {
    readonly id: string;
    readonly title: string;
    readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  }[];
  readonly labels: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: string | null;
  }[];
  readonly project: { readonly id: string; readonly name: string } | null;
  readonly parentTask: {
    readonly id: string;
    readonly title: string;
    readonly canonicalStatus: string;
  } | null;
  readonly areaName?: string;
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function KanbanTaskCard({ task, index }: { task: KanbanTask; index?: number }) {
  const anchor = anchorLabel(task.labels);
  const { openTask } = useTaskInspector();
  const parentTask = task.parentTask;
  const isSubtask = task.parentTaskId !== null;

  return (
    <div
      className={`card-surface rounded-lg border border-border/70 bg-card p-3 shadow-surface transition-all duration-150 hover:border-border hover:shadow-surface-hover ${
        anchor !== undefined ? labelHoverSurfaceClass : ''
      } ${isSubtask ? 'border-l-2 border-l-primary/50' : ''} hover:scale-[101%]`}
      style={{
        ...(anchor !== undefined ? labelSurfaceStyle(anchor.color) : {}),
        animationDelay: index === undefined ? undefined : `${Math.min(index, 8) * 40}ms`,
        position: 'relative',
      }}
    >
      {anchor !== undefined && <TaskIdentityBar color={anchor.color} />}

      {parentTask !== null && parentTask !== undefined && (
        <div className="mb-1.5 flex items-start gap-1.5">
          <button
            type="button"
            onClick={() => openTask(parentTask.id)}
            className="flex min-w-0 items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2"
            aria-label={`${parentTask.title} üst görevini aç`}
            title={`Üst görev: ${parentTask.title}`}
          >
            <ListTree className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate font-medium text-foreground/80">
              {parentTask.title}
            </span>
          </button>
        </div>
      )}

      <div className="truncate text-sm font-medium">{task.title}</div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        <SubtaskProgress
          parentTaskId={task.parentTaskId}
          subtaskCount={task.subtaskCount}
          completedSubtaskCount={task.completedSubtaskCount}
        />
        {task.isBlocked === true && (
          <Badge
            variant="neutral"
            title={task.blockedByTasks
              ?.map((blocker) => blocker.title)
              .join(', ')}
            className="gap-1"
          >
            <Lock className="size-3" aria-hidden="true" />
            Bloke
          </Badge>
        )}
        {task.project && <Badge variant="primary">{task.project.name}</Badge>}
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
