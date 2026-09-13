'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type TaskFilterName =
  | 'areaId'
  | 'projectId'
  | 'canonicalStatus'
  | 'priority'
  | 'labelId'
  | 'dateState';

export type TaskFilters = Partial<Record<TaskFilterName, string>>;

const STATUS_VALUES = ['TO_DO', 'IN_PROGRESS', 'COMPLETED'] as const;
const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const DATE_STATE_VALUES = ['overdue', 'dueToday', 'plannedToday', 'upcoming', 'noDate'] as const;

type UrlField = {
  readonly key: TaskFilterName;
  readonly urlName: string;
  readonly allowlist?: readonly string[];
};

const URL_FIELDS: readonly UrlField[] = [
  { key: 'areaId', urlName: 'areaId' },
  { key: 'projectId', urlName: 'projectId' },
  { key: 'canonicalStatus', urlName: 'status', allowlist: STATUS_VALUES },
  { key: 'priority', urlName: 'priority', allowlist: PRIORITY_VALUES },
  { key: 'labelId', urlName: 'label' },
  { key: 'dateState', urlName: 'dateState', allowlist: DATE_STATE_VALUES },
];

export function parseTaskFiltersFromUrl(searchParams: URLSearchParams): TaskFilters {
  const filters: TaskFilters = {};

  for (const { key, urlName, allowlist } of URL_FIELDS) {
    const raw = searchParams.get(urlName) ?? '';

    if (raw.length === 0) continue;

    if (allowlist !== undefined) {
      if ((allowlist as readonly string[]).includes(raw)) {
        filters[key] = raw;
      }
    } else {
      filters[key] = raw;
    }
  }

  return filters;
}

export function buildFilterQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();

  for (const { key, urlName } of URL_FIELDS) {
    const value = filters[key];
    if (value !== undefined && value.length > 0) {
      params.set(urlName, value);
    }
  }

  return params.toString();
}

export function useUrlTaskFilters(pathname: string): {
  readonly filters: TaskFilters;
  readonly setFilter: (key: TaskFilterName, value: string | undefined) => void;
  readonly clearAll: () => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseTaskFiltersFromUrl(searchParams), [searchParams]);

  const commit = useCallback(
    (apply: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      apply(params);
      const qs = params.toString();
      router.replace(qs.length > 0 ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setFilter = useCallback(
    (key: TaskFilterName, value: string | undefined) => {
      const field = URL_FIELDS.find((f) => f.key === key);
      if (field === undefined) return;
      commit((params) => {
        if (value === undefined || value.length === 0) {
          params.delete(field.urlName);
        } else {
          params.set(field.urlName, value);
        }
      });
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    commit((params) => {
      for (const { urlName } of URL_FIELDS) {
        params.delete(urlName);
      }
    });
  }, [commit]);

  return { filters, setFilter, clearAll };
}