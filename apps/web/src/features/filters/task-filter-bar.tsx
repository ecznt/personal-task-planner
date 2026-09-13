'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { FilterX } from 'lucide-react';

import { Select } from '@/components/ui/select';
import type { TaskFilterName, TaskFilters } from './url-task-filters';

type AreaSummary = {
  readonly id: string;
  readonly name: string;
};

type ProjectSummary = {
  readonly id: string;
  readonly name: string;
};

type LabelSummary = {
  readonly id: string;
  readonly name: string;
};

type TaskFilterBarProps = {
  readonly filters: TaskFilters;
  readonly onChange: (key: TaskFilterName, value: string | undefined) => void;
  readonly onClearAll: () => void;
};

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

const DATE_STATE_OPTIONS = [
  { value: 'overdue', label: 'Gecikmiş' },
  { value: 'dueToday', label: 'Bugün Bitiş' },
  { value: 'plannedToday', label: 'Bugün Planlı' },
  { value: 'upcoming', label: 'Yaklaşan' },
  { value: 'noDate', label: 'Tarihsiz' },
] as const;

export function TaskFilterBar({ filters, onChange, onClearAll }: TaskFilterBarProps) {
  const activeCount = (
    ['areaId', 'projectId', 'canonicalStatus', 'priority', 'labelId', 'dateState'] as const
  ).filter((key) => (filters[key] ?? '').length > 0).length;

  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/areas' });
      if (result.error !== undefined) {
        throw new Error('Alanlar yüklenemedi.');
      }
      return (result.data as { data: AreaSummary[] }).data ?? [];
    },
  });

  const projects = useQuery({
    queryKey: ['projects', filters.areaId ?? 'all'],
    queryFn: async () => {
      if (filters.areaId === undefined) return [];
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { areaId: filters.areaId },
      });
      if (result.error !== undefined) {
        throw new Error('Projeler yüklenemedi.');
      }
      return (result.data as { data: ProjectSummary[] }).data ?? [];
    },
    enabled: filters.areaId !== undefined,
  });

  const labels = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/labels' });
      if (result.error !== undefined) {
        throw new Error('Etiketler yüklenemedi.');
      }
      return (result.data as { data: LabelSummary[] }).data ?? [];
    },
  });

  const handleAreaChange = (value: string) => {
    onChange('areaId', value || undefined);
    onChange('projectId', undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterArea">
          Alan:
        </label>
        <Select id="filterArea" value={filters.areaId ?? ''} onChange={(e) => handleAreaChange(e.target.value)}>
          <option value="">Tümü</option>
          {areas.data?.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterProject">
          Proje:
        </label>
        <Select
          id="filterProject"
          value={filters.projectId ?? ''}
          onChange={(e) => onChange('projectId', e.target.value || undefined)}
          disabled={filters.areaId === undefined}
        >
          <option value="">Tümü</option>
          {projects.data?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterStatus">
          Durum:
        </label>
        <Select
          id="filterStatus"
          value={filters.canonicalStatus ?? ''}
          onChange={(e) => onChange('canonicalStatus', e.target.value || undefined)}
        >
          <option value="">Tümü</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterPriority">
          Öncelik:
        </label>
        <Select
          id="filterPriority"
          value={filters.priority ?? ''}
          onChange={(e) => onChange('priority', e.target.value || undefined)}
        >
          <option value="">Tümü</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterDateState">
          Tarih:
        </label>
        <Select
          id="filterDateState"
          value={filters.dateState ?? ''}
          onChange={(e) => onChange('dateState', e.target.value || undefined)}
        >
          <option value="">Tümü</option>
          {DATE_STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="filterLabel">
          Etiket:
        </label>
        <Select
          id="filterLabel"
          value={filters.labelId ?? ''}
          onChange={(e) => onChange('labelId', e.target.value || undefined)}
        >
          <option value="">Tümü</option>
          {labels.data?.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </Select>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm transition-all duration-150 hover:bg-accent active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <FilterX className="size-4" aria-hidden="true" />
          Temizle ({activeCount})
        </button>
      )}
    </div>
  );
}