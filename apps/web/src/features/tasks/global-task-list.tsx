'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

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

      <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="sort">
            Sırala:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm hover:bg-accent"
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
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Tümü</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {taskData.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          {statusFilter || priorityFilter ? 'Filtrelere uyan görev yok.' : 'Henüz görev yok.'}
        </div>
      ) : (
        <div className="space-y-2">
          {taskData.map((task) => (
            <Link
              key={task.id}
              href={`/app/areas/tasks/${task.id}`}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{task.title}</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'LOW'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {task.plannedAt && <span>Plan: {formatDate(task.plannedAt)}</span>}
                  {task.dueAt && <span>Bitiş: {formatDate(task.dueAt)}</span>}
                </div>
              </div>
              <div className="ml-4 text-sm text-muted-foreground">
                {task.canonicalStatus === 'TO_DO'
                  ? 'Yapılacak'
                  : task.canonicalStatus === 'IN_PROGRESS'
                    ? 'Devam Ediyor'
                    : 'Tamamlandı'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
