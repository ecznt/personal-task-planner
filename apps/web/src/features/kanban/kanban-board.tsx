'use client';

import { apiClient } from '@planner/api-client';
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Kanban, PencilIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DraggableKanbanCard,
  DroppableKanbanColumn,
  moveTaskBetweenColumns,
  preventCardDragFromControls,
  resolveDragMove,
  type DragTaskData,
} from '@/features/kanban/kanban-dnd';
import { KanbanTaskCard, type KanbanTask } from '@/features/kanban/kanban-task-card';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { celebrateTaskCompleted } from '@/features/today/celebration-store';
import {
  KanbanToolbar,
  useKanbanBoardFilters,
  type KanbanFilters,
} from '@/features/kanban/kanban-toolbar';
import { cn } from '@/lib/utils';

type KanbanColumn = {
  readonly count: number;
  readonly tasks: readonly KanbanTask[];
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

const CANONICAL_BY_COLUMN: Record<string, 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED'> = {
  todo: 'TO_DO',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
};

type MoveTarget = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

type MoveVariables = {
  taskId: string;
  target: MoveTarget;
  version: number;
  fromColumn: string;
};

function KanbanColumnView({
  columnKey,
  column,
  onMove,
}: {
  columnKey: string;
  column: KanbanColumn;
  onMove: (taskId: string, target: MoveTarget, version: number, fromColumn: string) => void;
}) {
  const { openTask } = useTaskInspector();

  return (
    <DroppableKanbanColumn id={columnKey} className="flex min-w-[260px] flex-1 flex-col">
      <div className="flex h-full flex-col rounded-xl border border-border/70 bg-muted/40 p-3 backdrop-blur-sm">
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
                <DraggableKanbanCard task={task} index={index} fromColumn={columnKey} />
                <div className="absolute right-1 top-1 z-10 flex gap-1">
                  <button
                    type="button"
                    onClick={() => openTask(task.id)}
                    className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                    aria-label={`${task.title} görevini düzenle`}
                  >
                    <PencilIcon className="size-3" aria-hidden="true" />
                  </button>
                  {columnKey !== 'todo' && (
                    <button
                      type="button"
                      onClick={() => onMove(task.id, 'TO_DO', task.version, columnKey)}
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
                          columnKey,
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
    </DroppableKanbanColumn>
  );
}

function buildGlobalKanbanQuery(filters: KanbanFilters): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.q.length > 0) query.q = filters.q;
  if (filters.areaId !== undefined) query.areaId = filters.areaId;
  if (filters.projectId !== undefined) query.projectId = filters.projectId;
  if (filters.priority !== undefined) query.priority = filters.priority;
  if (filters.labelId !== undefined) query.labelId = filters.labelId;

  return query;
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { filters, setQ, setFilter, setFilters, clearAll } = useKanbanBoardFilters({
    mode: 'url',
    pathname: '/app/kanban',
  });
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const kanbanQuery = buildGlobalKanbanQuery(filters);

  const kanban = useQuery({
    queryKey: ['tasks', 'kanban', filters],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/tasks/kanban',
        ...(Object.keys(kanbanQuery).length > 0 ? { query: kanbanQuery } : {}),
      });

      if (result.error !== undefined) {
        throw new Error('Kanban yüklenemedi.');
      }

      return result.data as KanbanResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, target, version }: MoveVariables) => {
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
    onMutate: async ({ taskId, target, fromColumn }: MoveVariables) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', 'kanban'] });

      const previous = queryClient.getQueryData<KanbanResponse>(['tasks', 'kanban', filters]);
      const toColumn = Object.entries(CANONICAL_BY_COLUMN).find(([, c]) => c === target)?.[0];

      if (toColumn !== undefined) {
        queryClient.setQueryData<KanbanResponse>(['tasks', 'kanban', filters], (old) =>
          old === undefined ? old : moveTaskBetweenColumns(old, taskId, fromColumn, toColumn),
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<KanbanResponse>(['tasks', 'kanban', filters], context.previous);
      }
      toast.error('Taşıma başarısız.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onSuccess: (_data, variables) => {
      if (variables.target === 'COMPLETED') {
        celebrateTaskCompleted();
      }
      toast.success('Görev taşındı');
    },
  });

  const handleMove = useCallback(
    (taskId: string, target: MoveTarget, version: number, fromColumn: string) => {
      moveMutation.mutate({ taskId, target, version, fromColumn });
    },
    [moveMutation],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;

      const source = event.operation.source;
      const target = event.operation.target;
      if (source === null || target === null) return;

      const move = resolveDragMove(source.data as DragTaskData, String(target.id));
      if (move !== null) {
        const targetStatus = CANONICAL_BY_COLUMN[move.toColumn];
        if (targetStatus !== undefined) {
          const sourceData = source.data as DragTaskData;
          handleMove(move.taskId, targetStatus, move.version, sourceData.fromColumn);
        }
      }
    },
    [handleMove],
  );

  if (kanban.isLoading && !kanban.data) {
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

  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" eyebrow="Görevler" description="Tüm alanlardaki görevler" />

      <KanbanToolbar
        filters={filters}
        onQChange={setQ}
        onFilterChange={setFilter}
        onFiltersChange={setFilters}
        onClearAll={clearAll}
        showArea
        projectsAreaId={filters.areaId}
      />

      <DragDropProvider
        sensors={[
          { plugin: PointerSensor, options: { preventActivation: preventCardDragFromControls } },
          KeyboardSensor,
        ]}
        onDragStart={(event) => {
          const sourceData = event.operation.source?.data as DragTaskData | undefined;
          setActiveTask(sourceData?.task ?? null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          role="region"
          aria-label="Kanban panosu, yatay kaydırılabilir"
        >
          <KanbanColumnView columnKey="todo" column={data.todo} onMove={handleMove} />
          <KanbanColumnView columnKey="inProgress" column={data.inProgress} onMove={handleMove} />
          <KanbanColumnView columnKey="completed" column={data.completed} onMove={handleMove} />
        </div>
        <DragOverlay>
          {activeTask !== null && (
            <div className={cn('pointer-events-none rotate-2 scale-[1.02] shadow-surface-hover')}>
              <KanbanTaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DragDropProvider>

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

export { buildGlobalKanbanQuery };
