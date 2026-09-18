import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  authCsrf: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
  },
  getAuthCsrf: (...args: unknown[]) => mocks.authCsrf(...args),
}));

import { CalendarView } from './calendar-view';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

function renderCalendarView(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskInspectorProvider>
        <CalendarView />
      </TaskInspectorProvider>
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
    mocks.apiGet.mockReset();
    mocks.authCsrf.mockReset();
    mocks.authCsrf.mockResolvedValue({
      data: {
        data: { token: 'csrf-token', expiresAt: '2026-09-14T10:00:00Z' },
      },
      error: undefined,
    });
  });

  it('renders page header and weekday headers', async () => {
    mocks.apiGet.mockResolvedValue(emptyCalendarResponse());

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Pzt')).toBeInTheDocument();
      expect(screen.getByText('Paz')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Takvim' })).toBeInTheDocument();
  });

  it('renders loading state initially', async () => {
    mocks.apiGet.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(emptyCalendarResponse()), 200)),
    );

    renderCalendarView();

    expect(screen.getAllByText('Takvim').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledTimes(1);
    });
  });

  it('renders error state when request fails', async () => {
    mocks.apiGet.mockRejectedValue(new Error('Network error'));

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
    mocks.apiGet.mockResolvedValue({
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

  it('renders a task listed in both planned and due once', async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        timezone: 'Europe/Istanbul',
        days: [
          {
            date: '2026-09-14',
            planned: [
              {
                id: 'dup',
                title: 'Görev A',
                priority: 'HIGH',
                canonicalStatus: 'TO_DO',
                plannedAt: '2026-09-14T09:00:00Z',
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
            ],
            due: [
              {
                id: 'dup',
                title: 'Görev A',
                priority: 'HIGH',
                canonicalStatus: 'TO_DO',
                plannedAt: '2026-09-14T09:00:00Z',
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
            ],
          },
        ],
      },
      error: undefined,
    });

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Görev A')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Görev A')).toHaveLength(1);
  });

  it('shows overdue tasks in their day cell', async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        timezone: 'Europe/Istanbul',
        days: [
          {
            date: '2026-09-14',
            planned: [
              {
                id: 'p1',
                title: 'Planlı Görev',
                priority: 'MEDIUM',
                canonicalStatus: 'TO_DO',
                plannedAt: '2026-09-14T09:00:00Z',
                dueAt: null,
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
            ],
            due: [
              {
                id: 'o1',
                title: 'Gecikmiş 1',
                priority: 'HIGH',
                canonicalStatus: 'TO_DO',
                plannedAt: null,
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
              {
                id: 'o2',
                title: 'Gecikmiş 2',
                priority: 'LOW',
                canonicalStatus: 'IN_PROGRESS',
                plannedAt: null,
                dueAt: '2026-09-14T18:00:00Z',
                lifecycleState: 'ACTIVE',
                version: 1,
                areaId: 'a1',
              },
            ],
          },
        ],
      },
      error: undefined,
    });

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Planlı Görev')).toBeInTheDocument();
      expect(screen.getByText('Gecikmiş 1')).toBeInTheDocument();
      expect(screen.getByText('Gecikmiş 2')).toBeInTheDocument();
    });
    expect(screen.queryByText(/\+1 daha/)).not.toBeInTheDocument();
  });

  it('opens the quick-add dialog when a day add button is clicked', async () => {
    mocks.apiGet.mockResolvedValue(emptyCalendarResponse());

    renderCalendarView();

    await waitFor(() => {
      expect(screen.getByText('Pzt')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /tarihine görev ekle/ });
    expect(addButtons.length).toBeGreaterThan(0);

    const user = userEvent.setup();
    const firstAddButton = addButtons[0];
    if (firstAddButton === undefined) {
      throw new Error('Expected at least one day add button.');
    }
    await user.click(firstAddButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Yeni görev' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Başlangıç Tarihi')).toBeInTheDocument();
  });
});
