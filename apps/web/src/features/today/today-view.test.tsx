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
      untimed: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Bugünün senden isteyeceği bir şey yok/)).toBeInTheDocument();
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
      untimed: { count: 0, tasks: [] },
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
      untimed: { count: 0, tasks: [] },
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
      untimed: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Bugünün senden isteyeceği bir şey yok/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Bugün görev yok/)).toBeInTheDocument();
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
      untimed: { count: 0, tasks: [] },
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

  it('renders the untimed section with a count', async () => {
    mockToday({
      today: '2026-08-21',
      timezone: 'Europe/Istanbul',
      overdue: { count: 0, tasks: [] },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
      untimed: {
        count: 1,
        tasks: [
          {
            id: 'task-untimed',
            title: 'Tarihsiz Görev',
            priority: 'MEDIUM',
            canonicalStatus: 'TO_DO',
            dueAt: null,
            plannedAt: null,
            lifecycleState: 'ACTIVE',
            reasons: ['untimed'],
            labels: [],
          },
        ],
      },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText(/Tarihsiz \(1\)/)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Tarihsiz Görev').length).toBeGreaterThan(0);
    expect(screen.getByText('Tarihsiz')).toBeInTheDocument();
  });

  it('renders summary stat cards with derived counts', async () => {
    mockToday({
      today: '2026-08-21',
      timezone: 'Europe/Istanbul',
      overdue: { count: 2, tasks: [] },
      plannedToday: { count: 1, tasks: [] },
      dueToday: { count: 3, tasks: [] },
      completedToday: { count: 4, tasks: [] },
      untimed: { count: 2, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText('Toplam')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Gecikmiş').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tamamlanan').length).toBeGreaterThan(0);

    // Toplam = overdue(2) + plannedToday(1) + dueToday(3) + untimed(2) + completedToday(4) = 12
    const totalTitle = screen.getByText('Toplam');
    const totalCard = totalTitle.closest('[data-slot="card"]');
    expect(totalCard).not.toBeNull();
    expect(totalCard).toHaveTextContent('12');

    // Bugün = plannedToday(1) + dueToday(3) = 4
    const todayTitle = screen
      .getAllByText('Bugün')
      .find((el) => el.closest('[data-slot="card"]') !== null);
    expect(todayTitle).toBeDefined();
    const todayCard = todayTitle?.closest('[data-slot="card"]');
    expect(todayCard).toHaveTextContent('4');

    // Gecikmiş = 2
    const overdueTitle = screen
      .getAllByText('Gecikmiş')
      .find((el) => el.closest('[data-slot="card"]') !== null);
    expect(overdueTitle).toBeDefined();
    const overdueCard = overdueTitle?.closest('[data-slot="card"]');
    expect(overdueCard).toHaveTextContent('2');

    // Tamamlanan = 4
    const completedTitle = screen
      .getAllByText('Tamamlanan')
      .find((el) => el.closest('[data-slot="card"]') !== null);
    expect(completedTitle).toBeDefined();
    const completedCard = completedTitle?.closest('[data-slot="card"]');
    expect(completedCard).toHaveTextContent('4');
  });

  it('renders stat cards with zero counts when there are no tasks', async () => {
    mockToday({
      today: '2026-08-21',
      timezone: 'Europe/Istanbul',
      overdue: { count: 0, tasks: [] },
      plannedToday: { count: 0, tasks: [] },
      dueToday: { count: 0, tasks: [] },
      completedToday: { count: 0, tasks: [] },
      untimed: { count: 0, tasks: [] },
    });

    renderTodayView();

    await waitFor(() => {
      expect(screen.getByText('Toplam')).toBeInTheDocument();
    });

    const totalCard = screen.getByText('Toplam').closest('[data-slot="card"]');
    expect(totalCard).toHaveTextContent('0');
  });
});
