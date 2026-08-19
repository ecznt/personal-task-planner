'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Spinner } from '@/components/ui/spinner';

type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
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
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner />
      </div>
    );
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
      {taskData.map((task) => (
        <Link
          key={task.id}
          href={`/app/areas/tasks/${task.id}`}
          className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{task.title}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  task.priority === 'HIGH'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'LOW'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
              {task.dueAt && <span>Bitiş: {new Date(task.dueAt).toLocaleDateString('tr-TR')}</span>}
            </div>
          </div>
          <div className="ml-4 text-sm text-muted-foreground">{task.canonicalStatus}</div>
        </Link>
      ))}
    </div>
  );
}
