import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { AreaKanbanBoard } from './area-kanban-board';

const mockedApiClient = vi.mocked(apiClient);

function renderAreaKanbanBoard(areaId = 'area-1', queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AreaKanbanBoard areaId={areaId} />
    </QueryClientProvider>,
  );
}

describe('AreaKanbanBoard', () => {
  it('renders area-specific columns', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        statuses: [
          { id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
          { id: 's2', name: 'İnceleme', canonicalStatus: 'IN_PROGRESS', position: 2 },
        ],
        columns: [
          { statusId: 's1', count: 0, tasks: [] },
          { statusId: 's2', count: 0, tasks: [] },
        ],
      },
      error: undefined,
    });

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Yapılacak')).toBeInTheDocument();
      expect(screen.getByText('İnceleme')).toBeInTheDocument();
    });
  });

  it('renders tasks in columns', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        statuses: [
          { id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
        ],
        columns: [
          {
            statusId: 's1',
            count: 1,
            tasks: [
              {
                id: 'task-1',
                title: 'Alan Görevi',
                priority: 'HIGH',
                canonicalStatus: 'TO_DO',
                dueAt: null,
                plannedAt: null,
                lifecycleState: 'ACTIVE',
              },
            ],
          },
        ],
      },
      error: undefined,
    });

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Alan Görevi')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        statuses: [
          { id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
        ],
        columns: [
          { statusId: 's1', count: 0, tasks: [] },
        ],
      },
      error: undefined,
    });

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Bu alanda henüz görev yok/)).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockedApiClient.get.mockResolvedValue({
      data: undefined,
      error: { status: 500 },
    });

    renderAreaKanbanBoard('area-1', queryClient);

    await waitFor(() => {
      expect(screen.getByText('Kanban yüklenemedi.')).toBeInTheDocument();
    });
  });
});
