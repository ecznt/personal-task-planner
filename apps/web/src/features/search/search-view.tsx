'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

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

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
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
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/app/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false });
    } else {
      router.replace('/app/search', { scroll: false });
    }
  }, [debouncedQuery, router]);

  const search = useQuery({
    queryKey: ['search', 'tasks', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return null;

      const result = await apiClient.get({
        url: '/api/v1/search/tasks',
        query: { q: debouncedQuery, limit: 20 },
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
        <h1 className="text-2xl font-bold tracking-tight">Arama</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Görev başlıklarında ve açıklamalarında arama yapın
        </p>
      </div>

      <div className="relative">
        <Input
          type="search"
          placeholder="Görev ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pl-4"
          autoFocus
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
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {PRIORITY_LABELS[result.priority]}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {result.canonicalStatus === 'TO_DO'
                      ? 'Yapılacak'
                      : result.canonicalStatus === 'IN_PROGRESS'
                        ? 'Devam Ediyor'
                        : 'Tamamlandı'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {result.plannedAt && (
                  <span>Başlangıç: {formatDate(result.plannedAt)}</span>
                )}
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
          <div className="text-muted-foreground">
            Aramak istediğiniz terimi girin
          </div>
        </div>
      )}
    </div>
  );
}
