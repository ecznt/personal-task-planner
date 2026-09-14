import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { CalendarView } from './calendar-view';

const mockedApiClient = vi.mocked(apiClient);

function renderCalendarView(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CalendarView />
    </QueryClientProvider>,
  );
}

function emptyCalendarResponse() {
  return {
    data: {
      timezone: 'Europe/Istanbul',
      days: [
        { date: '2026-09-14', planned: [], due: [] },
        { date: '2026-09-15', planned: [], due: [] },
      ],
    },
    error: undefined,
  };
}

describe('CalendarView', () => {
  beforeEach(() => {
    mockedApiClient.get.mockReset();
  });

  it('renders page header and weekday headers', async () => {
    mockedApiClient.get.mockResolvedValue(emptyCalendarResponse());

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Pzt')).toBeInTheDocument();
      expect(screen.getByText('Paz')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Takvim' })).toBeInTheDocument();
  });

  it('renders loading state initially', async () => {
    mockedApiClient.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(emptyCalendarResponse()), 200)),
    );

    renderCalendarView();

    expect(screen.getAllByText('Takvim').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  it('renders error state when request fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    renderCalendarView(
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('Takvim yüklenemedi.')).toBeInTheDocument();
    });
  });

  it('renders tasks in a day cell with overflow indicator', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        timezone: 'Europe/Istanbul',
        days: [
          {
            date: '2026-09-14',
            planned: [
              {
                id: 't1',
                title: 'Görev A',
                priority: 'HIGH',
                canonicalStatus: 'TO_DO',
                plannedAt: '2026-09-14T09:00:00Z',
                dueAt: null,
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
              {
                id: 't2',
                title: 'Görev B',
                priority: 'MEDIUM',
                canonicalStatus: 'TO_DO',
                plannedAt: null,
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
              {
                id: 't3',
                title: 'Görev C',
                priority: 'LOW',
                canonicalStatus: 'TO_DO',
                plannedAt: null,
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
              {
                id: 't4',
                title: 'Görev D',
                priority: 'LOW',
                canonicalStatus: 'TO_DO',
                plannedAt: null,
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
            ],
            due: [],
          },
        ],
      },
      error: undefined,
    });

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Görev A')).toBeInTheDocument();
    });
    expect(screen.getByText('Görev B')).toBeInTheDocument();
    expect(screen.getByText(/\+1 daha/)).toBeInTheDocument();
    expect(screen.queryByText('Görev D')).not.toBeInTheDocument();
  });
});
