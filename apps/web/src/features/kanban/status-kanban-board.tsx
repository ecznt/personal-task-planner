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
import { ArrowLeft, ArrowRight, PencilIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export type KanbanStatus = {
  readonly id: string;
  readonly name: string;
  readonly canonicalStatus: string;
  readonly position: number;
};

export type KanbanColumn = {
  readonly statusId: string;
  readonly count: number;
  readonly tasks: readonly KanbanTask[];
};

export type KanbanResponse = {
  readonly statuses: readonly KanbanStatus[];
  readonly columns: readonly KanbanColumn[];
};

export type KanbanMoveVariables = {
  taskId: string;
  targetStatusId: string;
  version: number;
  fromStatusId: string;
};

export type KanbanBoardScope =
  | { readonly kind: 'area'; readonly areaId: string }
  | { readonly kind: 'project'; readonly projectId: string; readonly areaId: string };

type BoardConfig = {
  readonly pathname: string;
  readonly listUrl: string;
  readonly moveUrl: string;
  readonly queryKeyPrefix: readonly string[];
  readonly showProject: boolean;
  readonly projectsAreaId: string;
  readonly ariaLabel: string;
  readonly emptyText: string;
  readonly createHref: string;
};

function getBoardConfig(scope: KanbanBoardScope): BoardConfig {
  if (scope.kind === 'area') {
    return {
      pathname: `/app/areas/${scope.areaId}`,
      listUrl: `/api/v1/areas/${scope.areaId}/kanban`,
      moveUrl: `/api/v1/areas/${scope.areaId}/kanban-moves`,
      queryKeyPrefix: ['areas', scope.areaId, 'kanban'],
      showProject: true,
      projectsAreaId: scope.areaId,
      ariaLabel: 'Alan Kanban panosu, yatay kaydırılabilir',
      emptyText: 'Bu alanda henüz görev yok.',
      createHref: `/app/areas/${scope.areaId}/tasks/new`,
    };
  }

  return {
    pathname: `/app/projects/${scope.projectId}`,
    listUrl: `/api/v1/projects/${scope.projectId}/kanban`,
    moveUrl: `/api/v1/projects/${scope.projectId}/kanban-moves`,
    queryKeyPrefix: ['projects', scope.projectId, 'kanban'],
    showProject: false,
    projectsAreaId: scope.areaId,
    ariaLabel: 'Proje Kanban panosu, yatay kaydırılabilir',
    emptyText: 'Bu projede henüz görev yok.',
    createHref: `/app/areas/${scope.areaId}/tasks/new`,
  };
}

function buildStatusKanbanQuery(
  scope: KanbanBoardScope,
  filters: KanbanFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.q.length > 0) query.q = filters.q;
  if (filters.priority !== undefined) query.priority = filters.priority;
  if (filters.labelId !== undefined) query.labelId = filters.labelId;
  if (scope.kind === 'area' && filters.projectId !== undefined) query.projectId = filters.projectId;

  return query;
}

function KanbanColumnView({
  column,
  statusName,
  columns,
  columnIndex,
  onMove,
}: {
  column: KanbanColumn;
  statusName: string;
  columns: readonly KanbanColumn[];
  columnIndex: number;
  onMove: (taskId: string, targetStatusId: string, version: number, fromStatusId: string) => void;
}) {
  const hasPrevious = columnIndex > 0;
  const hasNext = columnIndex < columns.length - 1;
  const { openTask } = useTaskInspector();

  return (
    <DroppableKanbanColumn id={column.statusId} className="flex min-w-[260px] flex-1 flex-col">
      <div className="flex h-full flex-col rounded-lg border bg-muted/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{statusName}</h2>
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
            column.tasks.map((task, index) => {
              const previousColumn = columns[columnIndex - 1];
              const nextColumn = columns[columnIndex + 1];
              return (
                <div key={task.id} className="group relative">
                  <DraggableKanbanCard task={task} index={index} fromColumn={column.statusId} />
                  <div className="absolute right-1 top-1 z-10 flex gap-1">
                    <button
                      type="button"
                      onClick={() => openTask(task.id)}
                      className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                      aria-label={`${task.title} görevini düzenle`}
                    >
                      <PencilIcon className="size-3" aria-hidden="true" />
                    </button>
                    {hasPrevious && previousColumn && (
                      <button
                        type="button"
                        onClick={() =>
                          onMove(task.id, previousColumn.statusId, task.version, column.statusId)
                        }
                        className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                        aria-label={`${task.title} görevini önceki duruma taşı`}
                      >
                        <ArrowLeft className="size-3" aria-hidden="true" />
                      </button>
                    )}
                    {hasNext && nextColumn && (
                      <button
                        type="button"
                        onClick={() =>
                          onMove(task.id, nextColumn.statusId, task.version, column.statusId)
                        }
                        className="rounded bg-background/80 px-1.5 py-0.5 text-muted-foreground backdrop-blur transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-background"
                        aria-label={`${task.title} görevini sonraki duruma taşı`}
                      >
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DroppableKanbanColumn>
  );
}

export function StatusKanbanBoard({ scope }: { scope: KanbanBoardScope }) {
  const queryClient = useQueryClient();
  const config = getBoardConfig(scope);
  const { filters, setQ, setFilter, clearAll } = useKanbanBoardFilters({
    mode: 'url',
    pathname: config.pathname,
  });
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const kanbanQuery = buildStatusKanbanQuery(scope, filters);

  const kanban = useQuery({
    queryKey: [...config.queryKeyPrefix, filters],
    queryFn: async () => {
      const result = await apiClient.get({
        url: config.listUrl,
        ...(Object.keys(kanbanQuery).length > 0 ? { query: kanbanQuery } : {}),
      });

      if (result.error !== undefined) {
        throw new Error('Kanban yüklenemedi.');
      }

      return result.data as KanbanResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, targetStatusId, version }: KanbanMoveVariables) => {
      const result = await apiClient.post({
        url: config.moveUrl,
        body: { taskId, targetAreaStatusId: targetStatusId },
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
    onMutate: async ({ taskId, targetStatusId, fromStatusId }: KanbanMoveVariables) => {
      await queryClient.cancelQueries({ queryKey: config.queryKeyPrefix });

      const previous = queryClient.getQueryData<KanbanResponse>([
        ...config.queryKeyPrefix,
        filters,
      ]);

      if (previous !== undefined) {
        const record = Object.fromEntries(
          previous.columns.map((column) => [column.statusId, column]),
        );
        const nextRecord = moveTaskBetweenColumns(record, taskId, fromStatusId, targetStatusId);
        queryClient.setQueryData<KanbanResponse>([...config.queryKeyPrefix, filters], {
          ...previous,
          columns: previous.columns.map((column) => nextRecord[column.statusId] ?? column),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<KanbanResponse>([...config.queryKeyPrefix, filters], {
          ...context.previous,
        });
      }
      toast.error('Taşıma başarısız.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKeyPrefix });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
    },
    onSuccess: (_data, variables) => {
      const completedStatus = kanban.data?.statuses.find(
        (status) => status.canonicalStatus === 'COMPLETED',
      );
      if (completedStatus !== undefined && completedStatus.id === variables.targetStatusId) {
        celebrateTaskCompleted();
      }
      toast.success('Görev taşındı');
    },
  });

  const handleMove = useCallback(
    (taskId: string, targetStatusId: string, version: number, fromStatusId: string) => {
      moveMutation.mutate({ taskId, targetStatusId, version, fromStatusId });
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
        const sourceData = source.data as DragTaskData;
        handleMove(move.taskId, move.toColumn, move.version, sourceData.fromColumn);
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

  const allEmpty = data.columns.every((col) => col.count === 0);

  return (
    <div className="space-y-4">
      <KanbanToolbar
        filters={filters}
        onQChange={setQ}
        onFilterChange={setFilter}
        onClearAll={clearAll}
        showArea={false}
        showProject={config.showProject}
        projectsAreaId={config.projectsAreaId}
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
          aria-label={config.ariaLabel}
        >
          {data.columns.map((column, index) => {
            const status = data.statuses.find((s) => s.id === column.statusId);
            return (
              <KanbanColumnView
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
        <DragOverlay>
          {activeTask !== null && (
            <div className={cn('pointer-events-none rotate-2 scale-[1.02] shadow-surface-hover')}>
              <KanbanTaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DragDropProvider>

      {allEmpty && (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>{config.emptyText}</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link
              href={config.createHref}
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

export { buildStatusKanbanQuery };
