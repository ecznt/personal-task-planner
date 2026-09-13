'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/empty-state';
import { ListSkeleton } from '@/components/list-skeleton';
import { PageHeader } from '@/components/page-header';
import { Select } from '@/components/ui/select';
import { TaskFilterBar } from '@/features/filters/task-filter-bar';
import { useUrlTaskFilters } from '@/features/filters/url-task-filters';
import { TaskPriorityBadge } from './task-badge';
import { BulkActionBar } from './bulk-action-bar';

type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
  readonly version: number;
};

type GlobalTaskListProps = {
  readonly projectId?: string;
  readonly embedded?: boolean;
};

const SORT_OPTIONS = [
  { value: 'plannedDate', label: 'Planlanan Tarih' },
  { value: 'dueDate', label: 'Bitiş Tarihi' },
  { value: 'priority', label: 'Öncelik' },
  { value: 'title', label: 'Başlık' },
  { value: 'createdAt', label: 'Oluşturma' },
  { value: 'updatedAt', label: 'Güncelleme' },
] as const;

const STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'Yapılacak' },
  { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { value: 'COMPLETED', label: 'Tamamlandı' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

export function GlobalTaskList({
  projectId,
  embedded = false,
}: GlobalTaskListProps) {
  const standalone = projectId === undefined;
  const urlFilters = useUrlTaskFilters('/app/tasks');
  const [localStatusFilter, setLocalStatusFilter] = useState('');
  const [localPriorityFilter, setLocalPriorityFilter] = useState('');
  const [sort, setSort] = useState('plannedDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<{ succeeded: number; failed: number } | null>(null);

  const statusFilter = standalone ? (urlFilters.filters.canonicalStatus ?? '') : localStatusFilter;
  const priorityFilter = standalone ? (urlFilters.filters.priority ?? '') : localPriorityFilter;
  const filterKey = standalone
    ? JSON.stringify(urlFilters.filters)
    : JSON.stringify({ projectId: projectId ?? 'all' });

  const tasks = useQuery({
    queryKey: ['tasks', 'global', sort, order, statusFilter, priorityFilter, filterKey],
    queryFn: async () => {
      const params: Record<string, string> = {
        sort,
        order,
        limit: '50',
      };

      if (projectId) params.projectId = projectId;
      if (statusFilter) params.canonicalStatus = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      if (standalone) {
        const { areaId, projectId: urlProjectId, labelId, dateState } = urlFilters.filters;

        if (areaId) params.areaId = areaId;
        if (urlProjectId) params.projectId = urlProjectId;
        if (labelId) params.labelId = labelId;

        if (dateState) {
          params.dateState = dateState;
          params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
      }

      const result = await apiClient.get({
        url: '/api/v1/tasks',
        query: params,
      });

      if (result.error !== undefined) {
        throw new Error('Görevler yüklenemedi.');
      }

      return (result.data as { data: TaskSummary[] })?.data ?? [];
    },
  });

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const selectedTasks = (tasks.data ?? [])
    .filter((t) => selectedTaskIds.has(t.id))
    .map((t) => ({ id: t.id, version: t.version }));

  if (tasks.isLoading) {
    return <ListSkeleton rows={6} />;
  }

  if (tasks.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>Görevler yüklenemedi.</AlertDescription>
      </Alert>
    );
  }

  const taskData = tasks.data ?? [];
  const hasActiveFilters =
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    (standalone &&
      (Object.values(urlFilters.filters) as readonly string[]).some((value) => value.length > 0));

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="Görevler"
          eyebrow="Görevler"
          description="Tüm alanlardaki aktif görevler"
        />
      )}

      {bulkResult && (
        <Alert variant={bulkResult.failed > 0 ? 'destructive' : 'default'}>
          <AlertTitle>İşlem Tamamlandı</AlertTitle>
          <AlertDescription>
            {bulkResult.succeeded} görev başarıyla güncellendi.
            {bulkResult.failed > 0 && ` ${bulkResult.failed} görev başarısız.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="card-surface flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-surface">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="sort">
            Sırala:
          </label>
          <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm transition-transform duration-150 hover:bg-accent active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {order === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {standalone && (
          <TaskFilterBar
            filters={urlFilters.filters}
            onChange={urlFilters.setFilter}
            onClearAll={urlFilters.clearAll}
          />
        )}

        {!standalone && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="statusFilter">
              Durum:
            </label>
            <Select
              id="statusFilter"
              value={localStatusFilter}
              onChange={(e) => setLocalStatusFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {!standalone && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="priorityFilter">
              Öncelik:
            </label>
            <Select
              id="priorityFilter"
              value={localPriorityFilter}
              onChange={(e) => setLocalPriorityFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                setSelectedTaskIds(new Set());
              }
            }}
            className={`h-8 rounded-lg border px-3 text-sm transition-all duration-150 active:scale-[0.97] ${
              selectionMode
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-transparent hover:bg-accent'
            }`}
          >
            {selectionMode ? 'Seçimi Kaldır' : 'Toplu İşlem'}
          </button>
        </div>
      </div>

      {taskData.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" aria-hidden="true" />}
          title={
            hasActiveFilters
              ? 'Filtrelere uyan görev yok.'
              : projectId
                ? 'Bu projede henüz görev yok.'
                : 'Henüz görev yok.'
          }
          description={
            hasActiveFilters
              ? 'Filtreleri temizleyip tekrar deneyin.'
              : 'İlk görevinizi oluşturduğunuzda burada görünür.'
          }
        />
      ) : (
        <div className="space-y-2">
          {taskData.map((task, index) => (
            <div
              key={task.id}
              className={`card-surface animate-fade-slide-in flex items-center rounded-xl border p-3 shadow-surface transition-all duration-150 active:scale-[0.97] ${
                selectionMode
                  ? selectedTaskIds.has(task.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:border-border hover:shadow-surface-hover'
                  : 'border-border/70 hover:border-border hover:shadow-surface-hover'
              }`}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              {selectionMode && (
                <button
                  type="button"
                  onClick={() => toggleTaskSelection(task.id)}
                  className="mr-3 flex h-5 w-5 items-center justify-center rounded border transition-colors duration-150"
                  style={{
                    backgroundColor: selectedTaskIds.has(task.id)
                      ? 'hsl(var(--primary))'
                      : 'transparent',
                    borderColor: selectedTaskIds.has(task.id)
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--border))',
                  }}
                >
                  {selectedTaskIds.has(task.id) && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}

              {selectionMode ? (
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <TaskPriorityBadge priority={task.priority} />
                    {task.plannedAt && <span>Plan: {formatDate(task.plannedAt)}</span>}
                    {task.dueAt && <span>Bitiş: {formatDate(task.dueAt)}</span>}
                  </div>
                </div>
              ) : (
                <Link href={`/app/areas/tasks/${task.id}`} className="min-w-0 flex-1">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <TaskPriorityBadge priority={task.priority} />
                    {task.plannedAt && <span>Plan: {formatDate(task.plannedAt)}</span>}
                    {task.dueAt && <span>Bitiş: {formatDate(task.dueAt)}</span>}
                  </div>
                </Link>
              )}

              <div className="ml-4 text-sm text-muted-foreground">
                {task.canonicalStatus === 'TO_DO'
                  ? 'Yapılacak'
                  : task.canonicalStatus === 'IN_PROGRESS'
                    ? 'Devam Ediyor'
                    : 'Tamamlandı'}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectionMode && selectedTasks.length > 0 && (
        <BulkActionBar
          selectedTasks={selectedTasks}
          onClearSelection={clearSelection}
          onResult={(result) => {
            setBulkResult(result);
            setTimeout(() => setBulkResult(null), 5000);
          }}
        />
      )}
    </div>
  );
}
