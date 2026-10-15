'use client';

import { useDroppable, useDraggable } from '@dnd-kit/react';
import { Archive, Loader2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import { KanbanTaskCard, type KanbanTask } from '@/features/kanban/kanban-task-card';
import { cn } from '@/lib/utils';

const interactiveControlSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

export function preventCardDragFromControls(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return target.closest(interactiveControlSelector) !== null;
}

export type DragTaskData = {
  readonly taskId: string;
  readonly version: number;
  readonly fromColumn: string;
  readonly task: KanbanTask;
};

export function resolveDragMove(
  sourceData: DragTaskData | undefined,
  targetColumn: string | null | undefined,
): { readonly taskId: string; readonly version: number; readonly toColumn: string } | null {
  if (sourceData === undefined || targetColumn === undefined || targetColumn === null) {
    return null;
  }

  if (sourceData.fromColumn === targetColumn) {
    return null;
  }

  return { taskId: sourceData.taskId, version: sourceData.version, toColumn: targetColumn };
}

/**
 * Like `resolveDragMove`, but additionally rejects targets that are not real
 * board columns (e.g. lifecycle zone ids leaking through as drop targets).
 */
export function resolveStatusDragMove(
  sourceData: DragTaskData | undefined,
  targetColumn: string | null | undefined,
  isKnownColumn: (statusId: string) => boolean,
): { readonly taskId: string; readonly version: number; readonly toColumn: string } | null {
  const move = resolveDragMove(sourceData, targetColumn);
  if (move === null) return null;
  return isKnownColumn(move.toColumn) ? move : null;
}

export type KanbanColumn<T> = {
  readonly count: number;
  readonly tasks: readonly T[];
};

export function moveTaskBetweenColumns<
  T extends { readonly id: string },
  C extends Record<string, KanbanColumn<T>>,
>(columns: C, taskId: string, fromColumn: string, toColumn: string): C {
  if (fromColumn === toColumn) return columns;

  const from = columns[fromColumn];
  const to = columns[toColumn];

  if (from === undefined || to === undefined) return columns;

  const task = from.tasks.find((t) => t.id === taskId);
  if (task === undefined) return columns;

  const next: C = {
    ...columns,
    [fromColumn]: { count: from.count - 1, tasks: from.tasks.filter((t) => t.id !== taskId) },
    [toColumn]: { count: to.count + 1, tasks: [...to.tasks, task] },
  };

  return next;
}

export const LIFECYCLE_ZONE_IDS = {
  archive: 'kanban-lifecycle-archive',
  trash: 'kanban-lifecycle-trash',
} as const;

export type KanbanLifecycleAction = 'archive' | 'trash';

export function resolveLifecycleDrop(
  sourceData: DragTaskData | undefined,
  targetId: string | null | undefined,
): KanbanLifecycleAction | null {
  if (sourceData === undefined || targetId === undefined || targetId === null) return null;
  if (sourceData.task.canonicalStatus !== 'COMPLETED') return null;

  if (targetId === LIFECYCLE_ZONE_IDS.archive) return 'archive';
  if (targetId === LIFECYCLE_ZONE_IDS.trash) return 'trash';
  return null;
}

export function removeTaskFromColumns<
  T extends { readonly id: string },
  C extends Record<string, KanbanColumn<T>>,
>(columns: C, taskId: string, fromColumn: string): C {
  const from = columns[fromColumn];
  if (from === undefined) return columns;

  const task = from.tasks.find((t) => t.id === taskId);
  if (task === undefined) return columns;

  return {
    ...columns,
    [fromColumn]: { count: from.count - 1, tasks: from.tasks.filter((t) => t.id !== taskId) },
  };
}

export function KanbanLifecycleDropZone({
  action,
  activeTask,
  pending,
}: {
  action: KanbanLifecycleAction;
  activeTask: KanbanTask | null;
  pending: boolean;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const isTrash = action === 'trash';
  const dragging = activeTask !== null;
  const eligible = activeTask?.canonicalStatus === 'COMPLETED';

  const { isDropTarget } = useDroppable({
    id: LIFECYCLE_ZONE_IDS[action],
    element: elementRef,
    disabled: pending,
    accept: (source) => {
      const data = source.data as DragTaskData | undefined;
      return data?.task?.canonicalStatus === 'COMPLETED';
    },
  });

  return (
    <div
      ref={elementRef}
      role="status"
      aria-label={`${isTrash ? 'Çöp' : 'Arşiv'} bırakma bölgesi`}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 text-xs font-medium transition-all duration-150',
        isTrash ? 'text-destructive/80' : 'text-muted-foreground',
        dragging && !eligible && 'opacity-40',
        isDropTarget &&
          cn(
            'scale-[1.02] ring-2',
            isTrash
              ? 'border-destructive/60 bg-destructive/10 ring-destructive/40'
              : 'border-primary/60 bg-primary/10 ring-primary/40',
          ),
        pending && 'cursor-wait opacity-60',
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : isTrash ? (
        <Trash2 className="size-4" aria-hidden="true" />
      ) : (
        <Archive className="size-4" aria-hidden="true" />
      )}
      <span>{isTrash ? 'Çöp' : 'Arşiv'}</span>
      {dragging && !eligible && (
        <span className="sr-only" aria-live="polite">
          Yalnızca tamamlanmış görevler bu bölgeye taşınabilir
        </span>
      )}
    </div>
  );
}

export function DraggableKanbanCard({
  task,
  index,
  fromColumn,
}: {
  task: KanbanTask;
  index: number;
  fromColumn: string;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const { isDragging } = useDraggable({
    id: task.id,
    element: elementRef,
    data: { taskId: task.id, version: task.version, fromColumn, task } satisfies DragTaskData,
  });

  return (
    <div
      ref={elementRef}
      className={cn('transition-opacity duration-150', isDragging && 'opacity-40')}
    >
      <KanbanTaskCard task={task} index={index} />
    </div>
  );
}

export function DroppableKanbanColumn({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const { isDropTarget } = useDroppable({ id, element: elementRef });

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-[box-shadow,ring] duration-150',
        isDropTarget && 'ring-2 ring-primary/40',
        className,
      )}
    >
      {children}
    </div>
  );
}
