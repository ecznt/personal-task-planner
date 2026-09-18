import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    patch: vi.fn(),
  },
  getAuthCsrf: vi.fn(),
}));

vi.mock('@/features/auth/auth-api', () => {
  class AuthApiErrorMock extends Error {
    constructor(
      message: string,
      readonly code?: string,
    ) {
      super(message);
      this.name = 'AuthApiError';
    }
  }

  return {
    csrfQueryKey: ['auth', 'csrf'] as const,
    fetchCsrf: async () => ({
      token: 'csrf-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
    }),
    apiError: (value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'detail' in value &&
        typeof value.detail === 'string'
      ) {
        return new AuthApiErrorMock(
          value.detail,
          'code' in value && typeof value.code === 'string' ? value.code : undefined,
        );
      }
      return new Error('İşlem tamamlanamadı.');
    },
    AuthApiError: AuthApiErrorMock,
  };
});

import { apiClient } from '@planner/api-client';
import { readTaskFromCache, taskDetailQueryKey, useTaskPatch, type TaskData } from './task-patch';

const mockedPatch = vi.mocked(apiClient.patch);

const taskData = (overrides: Partial<TaskData> = {}): TaskData => ({
  id: 'task-1',
  areaId: 'area-1',
  title: 'Rapor',
  description: null,
  plannedAt: null,
  dueAt: null,
  priority: 'MEDIUM',
  areaStatusId: 'status-todo',
  canonicalStatus: 'TO_DO',
  lifecycleState: 'ACTIVE',
  version: 1,
  labels: [],
  checklistItems: [],
  projectId: null,
  recurrence: null,
  ...overrides,
});

function renderPatch(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => useTaskPatch({ taskId: 'task-1' }), { wrapper });
}

beforeEach(() => {
  mockedPatch.mockReset();
});

describe('useTaskPatch', () => {
  it('merges edits made while a request is in flight into one follow-up request', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(taskDetailQueryKey('task-1'), { data: taskData() });

    let resolveFirst: (value: unknown) => void = () => {};
    const resolvers: Array<(value: unknown) => void> = [];
    mockedPatch.mockImplementation(
      () =>
        new Promise((resolve) => {
          const index = resolvers.length;
          resolvers.push(resolve);
          if (index === 0) {
            resolveFirst = resolve;
          }
        }),
    );

    const { result } = renderPatch(queryClient);

    act(() => {
      result.current.saveFields({ title: 'Rapor Güncel' });
    });

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.saveFields({ priority: 'HIGH' });
    });
    act(() => {
      result.current.saveFields({ dueAt: '2026-12-01T00:00:00.000Z' });
    });

    await act(async () => {
      resolveFirst({
        data: { data: taskData({ title: 'Rapor Güncel', version: 2 }) },
        error: undefined,
      });
    });

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledTimes(2));

    const resolveSecond = resolvers[1];
    if (resolveSecond === undefined) {
      throw new Error('second patch request was not started');
    }

    await act(async () => {
      resolveSecond({
        data: {
          data: taskData({
            title: 'Rapor Güncel',
            priority: 'HIGH',
            dueAt: '2026-12-01T00:00:00.000Z',
            version: 2,
          }),
        },
        error: undefined,
      });
    });

    await waitFor(() => expect(result.current.status).toBe('saved'));

    expect(mockedPatch).toHaveBeenCalledTimes(2);
    expect(mockedPatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: { taskId: 'task-1' },
        body: expect.objectContaining({
          priority: 'HIGH',
          dueAt: '2026-12-01T00:00:00.000Z',
        }),
        headers: expect.objectContaining({ 'If-Match': '2' }),
      }),
    );

    expect(readTaskFromCache(queryClient, 'task-1')).toMatchObject({
      dueAt: '2026-12-01T00:00:00.000Z',
      version: 2,
    });
  });

  it('rolls the cache back and reports an error when the request fails', async () => {
    const queryClient = new QueryClient();
    const seeded = taskData({ title: 'Rapor' });
    queryClient.setQueryData(taskDetailQueryKey('task-1'), { data: seeded });

    mockedPatch.mockResolvedValue({
      data: undefined,
      error: { detail: 'Sunucu hatası' },
    });

    const { result } = renderPatch(queryClient);

    act(() => {
      result.current.saveFields({ title: 'Bozuk' });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toContain('Sunucu hatası');
    expect(readTaskFromCache(queryClient, 'task-1')?.title).toBe('Rapor');
  });

  it('handles optimistic concurrency conflicts by refreshing', async () => {
    const queryClient = new QueryClient();
    const seeded = taskData({ title: 'Rapor' });
    queryClient.setQueryData(taskDetailQueryKey('task-1'), { data: seeded });

    mockedPatch.mockResolvedValue({
      data: undefined,
      error: { detail: 'Sürüm çakışması', code: 'VERSION_CONFLICT' },
    });

    const { result } = renderPatch(queryClient);

    act(() => {
      result.current.saveFields({ title: 'Rapor Değişti' });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toMatch(/En güncel değerler yüklendi/);
    expect(readTaskFromCache(queryClient, 'task-1')?.title).toBe('Rapor');
  });

  it('clears the error and returns to idle', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(taskDetailQueryKey('task-1'), { data: taskData() });

    mockedPatch.mockResolvedValue({ data: undefined, error: { detail: 'Sunucu hatası' } });

    const { result } = renderPatch(queryClient);

    act(() => {
      result.current.saveFields({ title: 'Bozuk' });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});