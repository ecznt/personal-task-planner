'use client';

import { apiClient } from '@planner/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

type AreaKanbanStatus = {
  readonly id: string;
  readonly name: string;
  readonly canonicalStatus: string;
  readonly position: number;
};

type AreaKanbanColumn = {
  readonly statusId: string;
  readonly count: number;
  readonly tasks: readonly TaskSummary[];
};

type AreaKanbanResponse = {
  readonly statuses: readonly AreaKanbanStatus[];
  readonly columns: readonly AreaKanbanColumn[];
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

function TaskCard({ task, index }: { task: TaskSummary; index: number }) {
  return (
    <Link
      href={`/app/areas/tasks/${task.id}`}
      className="animate-fade-slide-in block rounded-lg border bg-card p-3 transition-colors duration-150 active:scale-[0.97] hover:bg-accent"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="truncate text-sm font-medium">{task.title}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            task.priority === 'HIGH'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : task.priority === 'LOW'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.dueAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </Link>
  );
}

function AreaKanbanColumnView({
  column,
  statusName,
  columns,
  columnIndex,
  onMove,
}: {
  column: AreaKanbanColumn;
  statusName: string;
  columns: readonly AreaKanbanColumn[];
  columnIndex: number;
  onMove: (taskId: string, targetAreaStatusId: string) => void;
}) {
  const hasPrevious = columnIndex > 0;
  const hasNext = columnIndex < columns.length - 1;

  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-lg border bg-muted/50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{statusName}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.count}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        {column.tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Boş
          </div>
        ) : (
          column.tasks.map((task, index) => (
            <div key={task.id} className="group relative">
              <TaskCard task={task} index={index} />
              <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
                {hasPrevious && (
                  <button
                    type="button"
                    onClick={() => columns[columnIndex - 1] && onMove(task.id, columns[columnIndex - 1]!.statusId)}
                    className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 active:scale-90 hover:bg-background"
                    title="Önceki duruma taşı"
                  >
                    <ArrowLeft className="size-3" />
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={() => columns[columnIndex + 1] && onMove(task.id, columns[columnIndex + 1]!.statusId)}
                    className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 active:scale-90 hover:bg-background"
                    title="Sonraki duruma taşı"
                  >
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AreaKanbanBoard({ areaId }: { areaId: string }) {
  const queryClient = useQueryClient();

  const kanban = useQuery({
    queryKey: ['areas', areaId, 'kanban'],
    queryFn: async () => {
      const result = await apiClient.get({ url: `/api/v1/areas/${areaId}/kanban` });

      if (result.error !== undefined) {
        throw new Error('Kanban yüklenemedi.');
      }

      return result.data as AreaKanbanResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, targetAreaStatusId }: { taskId: string; targetAreaStatusId: string }) => {
      const result = await apiClient.post({
        url: `/api/v1/areas/${areaId}/kanban-moves`,
        body: { taskId, targetAreaStatusId },
        headers: { 'Content-Type': 'application/json' },
      });

      if (result.error !== undefined) {
        throw new Error('Taşıma başarısız.');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'kanban'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      toast.success('Görev taşındı');
    },
  });

  if (kanban.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (kanban.isError || !kanban.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>Kanban yüklenemedi.</AlertDescription>
      </Alert>
    );
  }

  const data = kanban.data;

  const handleMove = (taskId: string, targetAreaStatusId: string) => {
    moveMutation.mutate({ taskId, targetAreaStatusId });
  };

  const allEmpty = data.columns.every((col) => col.count === 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {data.columns.map((column, index) => {
          const status = data.statuses.find((s) => s.id === column.statusId);
          return (
            <AreaKanbanColumnView
              key={column.statusId}
              column={column}
              statusName={status?.name ?? ''}
              columns={data.columns}
              columnIndex={index}
              onMove={handleMove}
            />
          );
        })}
      </div>

      {allEmpty && (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Bu alanda henüz görev yok.</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link
              href={`/app/areas/${areaId}/tasks/new`}
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-150 active:scale-[0.97] hover:bg-primary/90"
            >
              Görev Oluştur
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
