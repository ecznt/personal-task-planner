import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { TodayView } from './today-view';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

const mockedApiClient = vi.mocked(apiClient);

function mockToday(data: object) {
  mockedApiClient.get.mockImplementation(async ({ url }) => {
    if (url === '/api/v1/tasks/statistics/weekly') {
      return {
        data: {
          timezone: 'Europe/Istanbul',
          totalCompleted: 1,
          days: [
            { date: '2026-08-15', count: 0 },
            { date: '2026-08-16', count: 0 },
            { date: '2026-08-17', count: 0 },
            { date: '2026-08-18', count: 0 },
            { date: '2026-08-19', count: 0 },
            { date: '2026-08-20', count: 0 },
            { date: '2026-08-21', count: 1 },
          ],
        },
        error: undefined,
      };
    }

    return { data, error: undefined };
  });
}

function renderTodayView(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskInspectorProvider>
        <TodayView />
      </TaskInspectorProvider>
    </QueryClientProvider>,
  );
}

describe('TodayView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no tasks', async () => {
    mockToday({
      today: '2026-08-21',
      timezone: 'Europe/Istanbul',
      overdue: { count: 0, tasks: [] },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Bugün için planlanmış/)).toBeInTheDocument();
    });
  });

  it('renders task sections with correct counts', async () => {
    mockToday({
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
            labels: [],
          },
        ],
      },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getAllByText('Gecikmiş Görev').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gecikmiş \(1\)/).length).toBeGreaterThan(0);
    });
  });

  it('renders the briefing with focus tasks', async () => {
    mockToday({
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
            labels: [],
          },
        ],
      },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Gün özeti' })).toBeInTheDocument();
    });

    expect(screen.getByText(/görev seni bekliyor/)).toBeInTheDocument();
    expect(screen.getAllByText('Gecikmiş Görev').length).toBeGreaterThan(0);
  });

  it('renders the weekly statistics chart', async () => {
    mockToday({
      today: '2026-08-21',
      timezone: 'Europe/Istanbul',
      overdue: { count: 0, tasks: [] },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText('Haftalık tamamlanan')).toBeInTheDocument();
    });

    expect(screen.getByText(/1 görev/)).toBeInTheDocument();
  });

  it('renders section headers', async () => {
    mockToday({
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
            labels: [{ id: 'label-1', name: 'Acil', color: '#dc2626' }],
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
            labels: [{ id: 'label-2', name: 'İş', color: '#2563eb' }],
          },
        ],
      },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Gecikmiş \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Bugün Planlandı \(1\)/)).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('task-identity-bar')).toHaveLength(2);
    expect(screen.getByText('Acil')).toBeInTheDocument();
    expect(screen.getByText('İş')).toBeInTheDocument();
  });
});