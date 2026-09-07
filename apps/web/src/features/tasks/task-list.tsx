'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { ListSkeleton } from '@/components/list-skeleton';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';

type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
};

type TaskListProps = {
  readonly areaId: string;
};

export function TaskList({ areaId }: TaskListProps) {
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
      {taskData.map((task, index) => (
        <Link
          key={task.id}
          href={`/app/areas/tasks/${task.id}`}
          className="animate-fade-slide-in flex items-center justify-between rounded-lg border bg-card p-3 transition-colors duration-150 active:scale-[0.97] hover:bg-accent"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{task.title}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <TaskPriorityBadge priority={task.priority} />
              {task.dueAt && <span>Bitiş: {new Date(task.dueAt).toLocaleDateString('tr-TR')}</span>}
            </div>
          </div>
          <div className="ml-4 text-sm text-muted-foreground">{task.canonicalStatus}</div>
        </Link>
      ))}
    </div>
  );
}
