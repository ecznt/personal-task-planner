'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { LabelDots } from '@/features/labels/label-chip';

import { DayQuickCreateDialog } from './day-quick-create-dialog';

type CalendarTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt?: string;
  readonly plannedAt?: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly areaId: string;
  readonly labels: readonly { readonly id: string; readonly name: string; readonly color: string | null }[];
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

export function CalendarView() {
  const { openTask } = useTaskInspector();
  const now = new Date();
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth());
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
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
              <div
                key={key}
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
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openTask(task.id)}
                      className="group flex w-full items-center gap-1 truncate rounded px-1 py-px text-left text-[10px] leading-snug sm:text-[11px] hover:bg-accent/70"
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
                    </button>
                  ))}
                  {allTasks.length > 3 && (
                    <span className="truncate px-1 text-[10px] text-muted-foreground/70">
                      +{allTasks.length - 3} daha
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DayQuickCreateDialog dateKey={quickAddDate} onClose={() => setQuickAddDate(null)} />
    </div>
  );
}
