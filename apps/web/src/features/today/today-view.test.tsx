import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { TodayView } from './today-view';

const mockedApiClient = vi.mocked(apiClient);

function renderTodayView(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TodayView />
    </QueryClientProvider>,
  );
}

describe('TodayView', () => {
  it('renders empty state when no tasks', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        today: '2026-08-21',
        timezone: 'Europe/Istanbul',
        overdue: { count: 0, tasks: [] },
        plannedToday: { count: 0, tasks: [] },
        dueToday: { count: 0, tasks: [] },
        completedToday: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Bugün için planlanmış/)).toBeInTheDocument();
    });
  });

  it('renders task sections with correct counts', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        today: '2026-08-21',
        timezone: 'Europe/Istanbul',
        overdue: {
          count: 1,
          tasks: [
            {
              id: 'task-1',
              title: 'Gecikmiş Görev',
              priority: 'HIGH',
              canonicalStatus: 'TO_DO',
              dueAt: '2026-08-20T10:00:00Z',
              plannedAt: null,
              lifecycleState: 'ACTIVE',
              reasons: ['overdue'],
            },
          ],
        },
        plannedToday: { count: 0, tasks: [] },
        dueToday: { count: 0, tasks: [] },
        completedToday: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText('Gecikmiş Görev')).toBeInTheDocument();
      expect(screen.getByText(/Gecikmiş \(1\)/)).toBeInTheDocument();
    });
  });

  it('renders section headers', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        today: '2026-08-21',
        timezone: 'Europe/Istanbul',
        overdue: {
          count: 1,
          tasks: [
            {
              id: 'task-1',
              title: 'Overdue',
              priority: 'HIGH',
              canonicalStatus: 'TO_DO',
              dueAt: '2026-08-20T10:00:00Z',
              plannedAt: null,
              lifecycleState: 'ACTIVE',
              reasons: ['overdue'],
            },
          ],
        },
        plannedToday: {
          count: 1,
          tasks: [
            {
              id: 'task-2',
              title: 'Planned',
              priority: 'MEDIUM',
              canonicalStatus: 'TO_DO',
              dueAt: null,
              plannedAt: '2026-08-21T09:00:00Z',
              lifecycleState: 'ACTIVE',
              reasons: ['plannedToday'],
            },
          ],
        },
        dueToday: { count: 0, tasks: [] },
        completedToday: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Gecikmiş \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Bugün Planlandı \(1\)/)).toBeInTheDocument();
    });
  });
});
