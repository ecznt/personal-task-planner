'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, FilterX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUrlTaskFilters } from '@/features/filters/url-task-filters';

export type KanbanFilterKey = 'areaId' | 'projectId' | 'priority' | 'labelId';

export type KanbanFilters = {
  q: string;
  areaId?: string | undefined;
  projectId?: string | undefined;
  priority?: string | undefined;
  labelId?: string | undefined;
};

const FILTER_KEYS: readonly KanbanFilterKey[] = ['areaId', 'projectId', 'priority', 'labelId'];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
] as const;

type AreaSummary = { readonly id: string; readonly name: string };
type ProjectSummary = { readonly id: string; readonly name: string };
type LabelSummary = { readonly id: string; readonly name: string };

type UseKanbanBoardFiltersOptions =
  { readonly mode: 'url'; readonly pathname: string } | { readonly mode: 'local' };

export function useKanbanBoardFilters(options: UseKanbanBoardFiltersOptions): {
  readonly filters: KanbanFilters;
  readonly setQ: (q: string) => void;
  readonly setFilter: (key: KanbanFilterKey, value: string | undefined) => void;
  readonly clearAll: () => void;
} {
  const isUrlMode = options.mode === 'url';
  const pathname = isUrlMode ? options.pathname : '/app/kanban';

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilters = useUrlTaskFilters(pathname);

  const [localFilters, setLocalFilters] = useState<KanbanFilters>({ q: '' });

  const filters: KanbanFilters = isUrlMode
    ? {
        q: searchParams.get('q') ?? '',
        areaId: urlFilters.filters.areaId,
        projectId: urlFilters.filters.projectId,
        priority: urlFilters.filters.priority,
        labelId: urlFilters.filters.labelId,
      }
    : localFilters;

  const setQ = useCallback(
    (q: string) => {
      if (!isUrlMode) {
        setLocalFilters((prev) => ({ ...prev, q }));
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (q.length > 0) {
        params.set('q', q);
      } else {
        params.delete('q');
      }

      const qs = params.toString();
      router.replace(qs.length > 0 ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [isUrlMode, pathname, router, searchParams],
  );

  const setFilter = useCallback(
    (key: KanbanFilterKey, value: string | undefined) => {
      if (!isUrlMode) {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
        return;
      }

      urlFilters.setFilter(key, value);
    },
    [isUrlMode, urlFilters],
  );

  const clearAll = useCallback(() => {
    setQ('');
    for (const key of FILTER_KEYS) {
      setFilter(key, undefined);
    }
  }, [setFilter, setQ]);

  return { filters, setQ, setFilter, clearAll };
}

type KanbanToolbarProps = {
  readonly filters: KanbanFilters;
  readonly onQChange: (q: string) => void;
  readonly onFilterChange: (key: KanbanFilterKey, value: string | undefined) => void;
  readonly onClearAll: () => void;
  readonly showArea: boolean;
  readonly projectsAreaId: string | undefined;
};

export function KanbanToolbar({
  filters,
  onQChange,
  onFilterChange,
  onClearAll,
  showArea,
  projectsAreaId,
}: KanbanToolbarProps) {
  const [query, setQuery] = useState(filters.q);
  const [displayedQ, setDisplayedQ] = useState(filters.q);

  if (displayedQ !== filters.q) {
    setDisplayedQ(filters.q);
    setQuery(filters.q);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onQChange(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [onQChange, query]);

  const activeCount = FILTER_KEYS.filter((key) => (filters[key] ?? '').length > 0).length;
  const hasActive = activeCount > 0 || filters.q.length > 0;

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
    queryKey: ['projects', projectsAreaId ?? 'all'],
    queryFn: async () => {
      if (projectsAreaId === undefined) return [];
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { areaId: projectsAreaId },
      });
      if (result.error !== undefined) {
        throw new Error('Projeler yüklenemedi.');
      }
      return (result.data as { data: ProjectSummary[] }).data ?? [];
    },
    enabled: projectsAreaId !== undefined,
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
    onFilterChange('areaId', value || undefined);
    onFilterChange('projectId', undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="kanbanSearch"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Görevlerde ara…"
          className="pl-8"
          aria-label="Görevlerde ara"
        />
      </div>

      {showArea && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="kanbanArea">
            Alan:
          </label>
          <Select
            id="kanbanArea"
            value={filters.areaId ?? ''}
            onChange={(e) => handleAreaChange(e.target.value)}
          >
            <option value="">Tümü</option>
            {areas.data?.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="kanbanProject">
          Proje:
        </label>
        <Select
          id="kanbanProject"
          value={filters.projectId ?? ''}
          onChange={(e) => onFilterChange('projectId', e.target.value || undefined)}
          disabled={projectsAreaId === undefined}
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
        <label className="text-sm text-muted-foreground" htmlFor="kanbanPriority">
          Öncelik:
        </label>
        <Select
          id="kanbanPriority"
          value={filters.priority ?? ''}
          onChange={(e) => onFilterChange('priority', e.target.value || undefined)}
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
        <label className="text-sm text-muted-foreground" htmlFor="kanbanLabel">
          Etiket:
        </label>
        <Select
          id="kanbanLabel"
          value={filters.labelId ?? ''}
          onChange={(e) => onFilterChange('labelId', e.target.value || undefined)}
        >
          <option value="">Tümü</option>
          {labels.data?.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </Select>
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm transition-all duration-150 hover:bg-accent active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <FilterX className="size-4" aria-hidden="true" />
          Temizle {activeCount > 0 ? `(${activeCount})` : ''}
        </button>
      )}
    </div>
  );
}
