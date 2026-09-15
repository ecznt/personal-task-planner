'use client';

import { useDroppable, useDraggable } from '@dnd-kit/react';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import { KanbanTaskCard, type KanbanTask } from '@/features/kanban/kanban-task-card';
import { cn } from '@/lib/utils';

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
