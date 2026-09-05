'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
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

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
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

export function GlobalTaskList() {
  const [sort, setSort] = useState('plannedDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<{ succeeded: number; failed: number } | null>(null);

  const tasks = useQuery({
    queryKey: ['tasks', 'global', sort, order, statusFilter, priorityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        sort,
        order,
        limit: '50',
      };

      if (statusFilter) params.canonicalStatus = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const queryString = new URLSearchParams(params).toString();
      const url = `/api/v1/tasks?${queryString}` as '/api/v1/tasks';

      const result = await apiClient.get({
        url,
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
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Görevler</h1>
        <p className="text-sm text-muted-foreground">Tüm alanlardaki aktif görevler</p>
      </div>

      {bulkResult && (
        <Alert variant={bulkResult.failed > 0 ? 'destructive' : 'default'}>
          <AlertTitle>İşlem Tamamlandı</AlertTitle>
          <AlertDescription>
            {bulkResult.succeeded} görev başarıyla güncellendi.
            {bulkResult.failed > 0 && ` ${bulkResult.failed} görev başarısız.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="sort">
            Sırala:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm transition-transform duration-150 hover:bg-accent active:scale-[0.97]"
          >
            {order === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="statusFilter">
            Durum:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Tümü</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="priorityFilter">
            Öncelik:
          </label>
          <select
            id="priorityFilter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Tümü</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

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
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          {statusFilter || priorityFilter ? 'Filtrelere uyan görev yok.' : 'Henüz görev yok.'}
        </div>
      ) : (
        <div className="space-y-2">
          {taskData.map((task, index) => (
            <div
              key={task.id}
              className={`animate-fade-slide-in flex items-center rounded-lg border bg-card p-3 transition-colors duration-150 active:scale-[0.97] ${
                selectionMode
                  ? selectedTaskIds.has(task.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                  : 'hover:bg-accent'
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
                    {task.plannedAt && <span>Plan: {formatDate(task.plannedAt)}</span>}
                    {task.dueAt && <span>Bitiş: {formatDate(task.dueAt)}</span>}
                  </div>
                </div>
              ) : (
                <Link href={`/app/areas/tasks/${task.id}`} className="min-w-0 flex-1">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
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
