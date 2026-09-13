'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Spinner } from '@/components/ui/spinner';
import { TaskFilterBar } from '@/features/filters/task-filter-bar';
import { useUrlTaskFilters } from '@/features/filters/url-task-filters';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';

type SearchResult = {
  readonly id: string;
  readonly title: string;
  readonly descriptionSnippet: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly plannedAt: string | null;
  readonly dueAt: string | null;
  readonly areaId: string;
  readonly version: number;
  readonly score: number;
};

type SearchPageData = {
  readonly data: readonly SearchResult[];
  readonly page: {
    readonly nextCursor?: string;
    readonly hasMore: boolean;
  };
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilters = useUrlTaskFilters('/app/search');
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    } else {
      params.delete('q');
    }

    const qs = params.toString();
    router.replace(qs.length > 0 ? `/app/search?${qs}` : '/app/search', { scroll: false });
  }, [debouncedQuery, router, searchParams]);

  const filterKey = JSON.stringify(urlFilters.filters);

  const search = useQuery({
    queryKey: ['search', 'tasks', debouncedQuery, filterKey],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return null;

      const queryParams: Record<string, string> = { q: debouncedQuery, limit: '20' };

      for (const [key, value] of Object.entries(urlFilters.filters) as [
        string,
        string,
      ][]) {
        if (value.length > 0) {
          if (key === 'canonicalStatus') {
            queryParams.canonicalStatus = value;
          } else if (key === 'labelId') {
            queryParams.labelId = value;
          } else {
            queryParams[key] = value;
          }
        }
      }

      if (urlFilters.filters.dateState !== undefined) {
        queryParams.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }

      const result = await apiClient.get({
        url: '/api/v1/search/tasks',
        query: queryParams,
      });

      if (result.error !== undefined) {
        throw new Error('Arama yapılamadı.');
      }

      return result.data as SearchPageData;
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleTaskClick = useCallback(
    (taskId: string) => {
      router.push(`/app/areas/tasks/${taskId}`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Arama"
          eyebrow="Arama"
          description="Görev başlıklarında ve açıklamalarında arama yapın"
        />
      </div>

      <div className="relative">
        <label htmlFor="app-search-input" className="sr-only">
          Görev ara
        </label>
        <Input
          id="app-search-input"
          type="search"
          role="searchbox"
          ref={searchInputRef}
          placeholder="Görev ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pl-4"
        />
      </div>

      <div className="card-surface rounded-xl border border-border/70 bg-card p-3 shadow-surface">
        <TaskFilterBar
          filters={urlFilters.filters}
          onChange={urlFilters.setFilter}
          onClearAll={urlFilters.clearAll}
        />
      </div>

      {search.isError && (
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{search.error?.message ?? 'Arama yapılamadı.'}</AlertDescription>
        </Alert>
      )}

      {search.isLoading && debouncedQuery.trim().length > 0 && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {search.data && debouncedQuery.trim().length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {search.data.data.length} sonuç bulundu
          </div>

          {search.data.data.length === 0 && (
            <div className="rounded-lg border bg-card p-8 text-center">
              <div className="text-muted-foreground">
                &quot;{debouncedQuery}&quot; için sonuç bulunamadı
              </div>
            </div>
          )}

          {search.data.data.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleTaskClick(result.id)}
              className="w-full rounded-lg border bg-card p-4 text-left transition-all duration-150 hover:border-primary/50 hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{result.title}</div>
                  {result.descriptionSnippet && (
                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {result.descriptionSnippet}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <TaskPriorityBadge priority={result.priority} />
                  <Badge variant="neutral">
                    {result.canonicalStatus === 'TO_DO'
                      ? 'Yapılacak'
                      : result.canonicalStatus === 'IN_PROGRESS'
                        ? 'Devam Ediyor'
                        : 'Tamamlandı'}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {result.plannedAt && <span>Başlangıç: {formatDate(result.plannedAt)}</span>}
                {result.dueAt && <span>Bitiş: {formatDate(result.dueAt)}</span>}
              </div>
            </button>
          ))}

          {search.data.page.hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" disabled>
                Daha fazla yükle ( yakında)
              </Button>
            </div>
          )}
        </div>
      )}

      {!debouncedQuery.trim() && !search.isLoading && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-muted-foreground">Aramak istediğiniz terimi girin</div>
        </div>
      )}
    </div>
  );
}
