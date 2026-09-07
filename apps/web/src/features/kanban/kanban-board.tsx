'use client';

import { apiClient } from '@planner/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Kanban } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';

type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
  readonly version: number;
  readonly areaId: string;
};

type KanbanColumn = {
  readonly count: number;
  readonly tasks: readonly TaskSummary[];
};

type KanbanResponse = {
  todo: KanbanColumn;
  inProgress: KanbanColumn;
  completed: KanbanColumn;
};

const COLUMN_LABELS: Record<string, string> = {
  todo: 'Yapılacak',
  inProgress: 'Devam Ediyor',
  completed: 'Tamamlandı',
};

function TaskCard({ task, index }: { task: TaskSummary; index: number }) {
  return (
    <Link
      href={`/app/areas/tasks/${task.id}`}
      className="card-surface animate-fade-slide-in block rounded-xl border border-border/70 bg-card p-3 shadow-surface transition-all duration-150 active:scale-[0.97] hover:border-border hover:shadow-surface-hover"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="truncate text-sm font-medium">{task.title}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        {task.dueAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </Link>
  );
}

function KanbanColumnView({
  columnKey,
  column,
  onMove,
}: {
  columnKey: string;
  column: KanbanColumn;
  onMove: (taskId: string, target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED', version: number) => void;
}) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-xl border border-border/70 bg-muted/40 p-3 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{COLUMN_LABELS[columnKey]}</h2>
        <span
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          aria-live="polite"
        >
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
              <div className="absolute right-1 top-1 z-10 flex gap-1">
                {columnKey !== 'todo' && (
                  <button
                    type="button"
                    onClick={() => onMove(task.id, 'TO_DO', task.version)}
                    className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                    aria-label={`${task.title} görevini Yapılacak'a taşı`}
                  >
                    <ArrowLeft className="size-3" aria-hidden="true" />
                  </button>
                )}
                {columnKey !== 'completed' && (
                  <button
                    type="button"
                    onClick={() =>
                      onMove(
                        task.id,
                        columnKey === 'todo' ? 'IN_PROGRESS' : 'COMPLETED',
                        task.version,
                      )
                    }
                    className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                    aria-label={`${task.title} görevini ${columnKey === 'todo' ? 'Devam Ediyor' : 'Tamamlandı'} durumuna taşı`}
                  >
                    <ArrowRight className="size-3" aria-hidden="true" />
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

export function KanbanBoard() {
  const queryClient = useQueryClient();

  const kanban = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/tasks/kanban' });

      if (result.error !== undefined) {
        throw new Error('Kanban yüklenemedi.');
      }

      return result.data as KanbanResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      taskId,
      target,
      version,
    }: {
      taskId: string;
      target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
      version: number;
    }) => {
      const result = await apiClient.post({
        url: '/api/v1/tasks/kanban-moves',
        body: { taskId, targetCanonicalStatus: target },
        headers: {
          'Content-Type': 'application/json',
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw new Error('Taşıma başarısız.');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      toast.success('Görev taşındı');
    },
  });

  if (kanban.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3" role="status" aria-label="Yükleniyor">
        {[0, 1, 2].map((col) => (
          <div key={col} className="space-y-2 rounded-lg border bg-muted/50 p-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
        <span className="sr-only">Yükleniyor</span>
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

  const handleMove = (
    taskId: string,
    target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
    version: number,
  ) => {
    moveMutation.mutate({ taskId, target, version });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" eyebrow="Görevler" description="Tüm alanlardaki görevler" />

      <div
        className="flex gap-4 overflow-x-auto pb-4"
        role="region"
        aria-label="Kanban panosu, yatay kaydırılabilir"
      >
        <KanbanColumnView columnKey="todo" column={data.todo} onMove={handleMove} />
        <KanbanColumnView columnKey="inProgress" column={data.inProgress} onMove={handleMove} />
        <KanbanColumnView columnKey="completed" column={data.completed} onMove={handleMove} />
      </div>

      {data.todo.count === 0 && data.inProgress.count === 0 && data.completed.count === 0 && (
        <EmptyState
          icon={<Kanban className="size-5" aria-hidden="true" />}
          title="Henüz Kanban'da görev yok"
          description="Görev oluşturduğunuzda panoda burada görünür."
          action={
            <Link
              href="/app/tasks"
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow transition-all duration-150 active:scale-[0.97] hover:bg-primary/90"
            >
              Görevlere Git
            </Link>
          }
        />
      )}
    </div>
  );
}
