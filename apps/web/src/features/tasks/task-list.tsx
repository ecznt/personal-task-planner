'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';

import { ListSkeleton } from '@/components/list-skeleton';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { SubtaskProgress } from '@/features/tasks/subtask-progress';
import { TaskStatusMenu } from '@/features/tasks/task-status-menu';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { anchorLabel } from '@/features/labels/label-color';
import {
  LabelChip,
  TaskIdentityBar,
  labelHoverSurfaceClass,
  labelSurfaceStyle,
} from '@/features/labels/label-chip';

type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly version: number;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
  readonly parentTaskId: string | null;
  readonly subtaskCount: number;
  readonly completedSubtaskCount: number;
  readonly labels: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: string | null;
  }[];
};

type TaskListProps = {
  readonly areaId: string;
};

export function TaskList({ areaId }: TaskListProps) {
  const { openTask } = useTaskInspector();

  const tasks = useQuery({
    queryKey: ['areas', areaId, 'tasks'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId },
      });

      if (result.error !== undefined) {
        throw new Error('Görevler yüklenemedi.');
      }

      return (result.data as { data: TaskSummary[] })?.data ?? [];
    },
  });

  if (tasks.isLoading) {
    return <ListSkeleton rows={4} />;
  }

  if (tasks.isError) {
    return null;
  }

  const taskData = tasks.data ?? [];

  if (taskData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Henüz görev yok.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {taskData.map((task, index) => {
        const labels = task.labels ?? [];
        const anchor = anchorLabel(labels);

        return (
          <div key={task.id} className="group relative">
            <button
              type="button"
              onClick={() => openTask(task.id)}
              onDoubleClick={() => openTask(task.id)}
              className={`animate-fade-slide-in flex w-full items-center justify-between rounded-lg border bg-card p-3 pr-10 text-left transition-colors duration-150 active:scale-[0.97] ${
                anchor !== undefined ? labelHoverSurfaceClass : ''
              } hover:scale-[101%]`}
              style={{
                animationDelay: `${Math.min(index, 8) * 40}ms`,
                ...(anchor !== undefined ? labelSurfaceStyle(anchor.color) : {}),
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{task.title}</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <TaskPriorityBadge priority={task.priority} />
                  <SubtaskProgress
                    parentTaskId={task.parentTaskId}
                    subtaskCount={task.subtaskCount}
                    completedSubtaskCount={task.completedSubtaskCount}
                  />
                  {task.dueAt && (
                    <span>Bitiş: {new Date(task.dueAt).toLocaleDateString('tr-TR')}</span>
                  )}
                  {labels.length > 0 && (
                    <span className="flex items-center gap-1">
                      {labels.slice(0, 2).map((label) => (
                        <LabelChip key={label.id} label={label} />
                      ))}
                      {labels.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{labels.length - 2}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </button>
            {anchor !== undefined && <TaskIdentityBar color={anchor.color} />}
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <TaskStatusMenu
                taskId={task.id}
                areaId={areaId}
                version={task.version}
                canonicalStatus={task.canonicalStatus}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
