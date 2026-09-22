'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, useCallback, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { LabelDots } from '@/features/labels/label-chip';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/react';

import { DayQuickCreateDialog } from './day-quick-create-dialog';

type CalendarTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt?: string;
  readonly plannedAt?: string;
  readonly durationMinutes?: number | null;
  readonly lifecycleState: string;
  readonly version: number;
  readonly areaId: string;
  readonly labels: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: string | null;
  }[];
};

type CalendarDayGroup = {
  readonly date: string;
  readonly planned: readonly CalendarTask[];
  readonly due: readonly CalendarTask[];
};

type CalendarResponse = {
  timezone: string;
  days: readonly CalendarDayGroup[];
};

const WEEKDAY_HEADERS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function toLocalKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function monthGridStart(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return new Date(year, month, 1 - mondayOffset);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function mergeDayTasks(day: CalendarDayGroup | undefined): CalendarTask[] {
  const seen = new Set<string>();
  const result: CalendarTask[] = [];

  for (const task of [...(day?.planned ?? []), ...(day?.due ?? [])]) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      result.push(task);
    }
  }

  return result;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  return `${minutes}dk`;
}

type DragTaskData = {
  readonly taskId: string;
  readonly version: number;
  readonly plannedAt: string | undefined;
  readonly task: CalendarTask;
};

function resolveCalendarDrop(
  sourceData: DragTaskData | undefined,
  targetDateKey: string | null | undefined,
): { readonly taskId: string; readonly version: number; readonly newPlannedAt: string } | null {
  if (sourceData === undefined || targetDateKey === undefined || targetDateKey === null) {
    return null;
  }

  const sourcePlannedAt = sourceData.plannedAt;
  let timePart = 'T09:00';
  if (sourcePlannedAt) {
    const timeMatch = sourcePlannedAt.match(/T(\d{2}:\d{2})/);
    if (timeMatch) {
      timePart = 'T' + timeMatch[1];
    }
  }

  const newPlannedAt = targetDateKey + timePart;

  if (sourceData.plannedAt === newPlannedAt) {
    return null;
  }

  return { taskId: sourceData.taskId, version: sourceData.version, newPlannedAt };
}

function DraggableCalendarTask({
  task,
  onOpen,
}: {
  task: CalendarTask;
  onOpen: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { isDragging } = useDraggable({
    id: task.id,
    element: ref,
    data: {
      taskId: task.id,
      version: task.version,
      plannedAt: task.plannedAt,
      task,
    } satisfies DragTaskData,
  });

  return (
    <div ref={ref} className={cn('transition-opacity duration-150', isDragging && 'opacity-40')}>
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className={cn(
          'group flex w-full items-center gap-1 truncate rounded px-1 py-px text-left text-[10px] leading-snug sm:text-[11px] hover:bg-accent/70',
          isDragging && 'cursor-grabbing',
        )}
      >
        <span
          className={cn(
            'inline-block size-1.5 shrink-0 rounded-full',
            task.priority === 'HIGH'
              ? 'bg-destructive'
              : task.priority === 'MEDIUM'
                ? 'bg-amber-500'
                : 'bg-muted-foreground/40',
          )}
        />
        <LabelDots labels={task.labels} />
        <span className="truncate">{task.title}</span>
        {task.plannedAt && (
          <span className="text-[9px] text-muted-foreground/70 ml-1 whitespace-nowrap">
            {formatTime(task.plannedAt)}
            {task.durationMinutes && (
              <span className="ml-1 bg-muted/60 px-1 rounded text-[8px]">
                {formatDuration(task.durationMinutes)}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}

function DroppableCalendarDay({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { isDropTarget } = useDroppable({ id, element: ref });

  return (
    <div
      ref={ref}
      className={cn(
        'transition-colors duration-150',
        isDropTarget && 'bg-primary/10 ring-2 ring-inset ring-primary/40',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CalendarView() {
  const { openTask } = useTaskInspector();
  const queryClient = useQueryClient();
  const now = new Date();
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth());
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  const today = todayKey();

  const gridStart = monthGridStart(cursorYear, cursorMonth);
  const gridEnd = addDays(gridStart, 41);

  const query = useQuery({
    queryKey: ['tasks', 'calendar', `${cursorYear}-${String(cursorMonth + 1).padStart(2, '0')}`],
    queryFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const start = toLocalKey(gridStart);
      const end = toLocalKey(gridEnd);

      const result = await apiClient.get({
        url: '/api/v1/tasks/calendar',
        query: { timezone, start, end },
      });

      if (result.error !== undefined) {
        throw new Error('Takvim yüklenemedi.');
      }

      return result.data as CalendarResponse;
    },
  });

  function prevMonth() {
    if (cursorMonth === 0) {
      setCursorMonth(11);
      setCursorYear((y) => y - 1);
    } else {
      setCursorMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (cursorMonth === 11) {
      setCursorMonth(0);
      setCursorYear((y) => y + 1);
    } else {
      setCursorMonth((m) => m + 1);
    }
  }

  function goToday() {
    const d = new Date();
    setCursorYear(d.getFullYear());
    setCursorMonth(d.getMonth());
  }

  const moveMutation = useMutation({
    mutationFn: async ({
      taskId,
      newPlannedAt,
      version,
    }: {
      taskId: string;
      newPlannedAt: string;
      version: number;
    }) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: '/api/v1/tasks/{taskId}',
        path: { taskId },
        body: { plannedAt: newPlannedAt },
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onMutate: async ({ taskId, newPlannedAt }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', 'calendar'] });

      const previousData = queryClient.getQueryData<CalendarResponse>(['tasks', 'calendar']);

      if (previousData) {
        const newDays = previousData.days.map((dayGroup) => {
          const allTasks = [...dayGroup.planned, ...dayGroup.due];
          const taskIndex = allTasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return dayGroup;

          const task = allTasks[taskIndex];
          const newPlannedAtDate = newPlannedAt.split('T')[0];
          const updatedTask = { ...task, plannedAt: newPlannedAt };

          const isInPlanned = dayGroup.planned.some((t) => t.id === taskId);
          const isInDue = dayGroup.due.some((t) => t.id === taskId);

          if (isInPlanned) {
            const newPlanned = dayGroup.planned.filter((t) => t.id !== taskId);
            if (newPlannedAtDate === dayGroup.date) {
              return { ...dayGroup, planned: [...newPlanned, updatedTask] };
            } else {
              return { ...dayGroup, planned: newPlanned };
            }
          } else if (isInDue) {
            const newDue = dayGroup.due.filter((t) => t.id !== taskId);
            if (newPlannedAtDate === dayGroup.date) {
              return { ...dayGroup, due: [...newDue, updatedTask] };
            } else {
              return { ...dayGroup, due: newDue };
            }
          }
          return dayGroup;
        });

        queryClient.setQueryData(['tasks', 'calendar'], {
          ...previousData,
          days: newDays,
        });
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tasks', 'calendar'], context.previousData);
      }
      toast.error('Görev taşınamadı.');
    },
    onSuccess: () => {
      toast.success('Görev taşındı');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;

      const source = event.operation.source;
      const target = event.operation.target;
      if (source === null || target === null) return;

      const move = resolveCalendarDrop(source.data as DragTaskData, String(target.id));
      if (move !== null) {
        moveMutation.mutate({
          taskId: move.taskId,
          newPlannedAt: move.newPlannedAt,
          version: move.version,
        });
      }
    },
    [moveMutation],
  );

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Takvim" eyebrow="Takvim" />
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-7 gap-px rounded-xl border border-border/70 bg-border/50 overflow-hidden">
            {Array.from({ length: 42 }, (_, i) => (
              <div key={i} className="h-28 bg-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Takvim" eyebrow="Takvim" />
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>Takvim yüklenemedi.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const daysByDate = new Map<string, CalendarDayGroup>();
  for (const day of query.data.days) {
    daysByDate.set(day.date, day);
  }

  const gridCells = Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, key: toLocalKey(date) };
  });

  const isCurrentMonth = cursorYear === now.getFullYear() && cursorMonth === now.getMonth();

  return (
    <DragDropProvider
      sensors={[
        { plugin: PointerSensor, options: { activationConstraint: { distance: 4 } } },
        KeyboardSensor,
      ]}
      onDragStart={(event) => {
        const sourceData = event.operation.source?.data as DragTaskData | undefined;
        setActiveTask(sourceData?.task ?? null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <PageHeader
          title="Takvim"
          eyebrow="Takvim"
          description={`${MONTH_NAMES[cursorMonth]} ${cursorYear} · ${query.data.timezone}`}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="inline-flex h-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.97]"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="inline-flex h-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.97]"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            disabled={isCurrentMonth}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 text-sm font-medium text-muted-foreground shadow-surface transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            Bugün
          </button>
        </div>

        <div className="rounded-xl border border-border/70 bg-card shadow-surface overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border/70">
            {WEEKDAY_HEADERS.map((h) => (
              <div
                key={h}
                className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
              >
                {h}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-border/50">
            {gridCells.map(({ date, key }) => {
              const day = daysByDate.get(key);
              const allTasks = mergeDayTasks(day);
              const isToday = key === today;
              const isCurrent = date.getMonth() === cursorMonth;

              return (
                <DroppableCalendarDay
                  key={key}
                  id={key}
                  className={cn(
                    'flex flex-col gap-1 h-28 overflow-hidden sm:h-32 p-1.5 transition-colors duration-150',
                    isToday && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
                    !isCurrent && 'bg-muted/30 text-muted-foreground/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday && 'bg-primary text-primary-foreground font-semibold',
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickAddDate(key)}
                      aria-label={`${key} tarihine görev ekle`}
                      className="flex size-5 items-center justify-center rounded text-muted-foreground/70 opacity-60 transition-all duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:opacity-0 sm:hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden">
                    {allTasks.slice(0, 3).map((task) => (
                      <DraggableCalendarTask key={task.id} task={task} onOpen={openTask} />
                    ))}
                    {allTasks.length > 3 && (
                      <span className="truncate px-1 text-[10px] text-muted-foreground/70">
                        +{allTasks.length - 3} daha
                      </span>
                    )}
                  </div>
                </DroppableCalendarDay>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask !== null && (
            <div className={cn('pointer-events-none rotate-2 scale-[1.02] shadow-surface-hover')}>
              <div className="flex w-full items-center gap-1 truncate rounded px-1 py-px text-left text-[10px] leading-snug sm:text-[11px] bg-card border">
                <span
                  className={cn(
                    'inline-block size-1.5 shrink-0 rounded-full',
                    activeTask.priority === 'HIGH'
                      ? 'bg-destructive'
                      : activeTask.priority === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/40',
                  )}
                />
                <LabelDots labels={activeTask.labels} />
                <span className="truncate">{activeTask.title}</span>
                {activeTask.plannedAt && (
                  <span className="text-[9px] text-muted-foreground/70 ml-1 whitespace-nowrap">
                    {formatTime(activeTask.plannedAt)}
                    {activeTask.durationMinutes && (
                      <span className="ml-1 bg-muted/60 px-1 rounded text-[8px]">
                        {formatDuration(activeTask.durationMinutes)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </DragOverlay>

        <DayQuickCreateDialog dateKey={quickAddDate} onClose={() => setQuickAddDate(null)} />
      </div>
    </DragDropProvider>
  );
}
