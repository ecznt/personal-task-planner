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
import { KanbanBoard } from './kanban-board';

const mockedApiClient = vi.mocked(apiClient);

function renderKanbanBoard(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <KanbanBoard />
    </QueryClientProvider>,
  );
}

describe('KanbanBoard', () => {
  it('renders three columns', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        todo: { count: 0, tasks: [] },
        inProgress: { count: 0, tasks: [] },
        completed: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Yapılacak/)).toBeInTheDocument();
      expect(screen.getByText(/Devam Ediyor/)).toBeInTheDocument();
      expect(screen.getByText(/Tamamlandı/)).toBeInTheDocument();
    });
  });

  it('renders tasks in columns', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        todo: {
          count: 1,
          tasks: [
            {
              id: 'task-1',
              title: 'Test Görevi',
              priority: 'HIGH',
              canonicalStatus: 'TO_DO',
              dueAt: null,
              plannedAt: null,
              lifecycleState: 'ACTIVE',
            },
          ],
        },
        inProgress: { count: 0, tasks: [] },
        completed: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Test Görevi')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        todo: { count: 0, tasks: [] },
        inProgress: { count: 0, tasks: [] },
        completed: { count: 0, tasks: [] },
      },
      error: undefined,
    });

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Henüz Kanban/)).toBeInTheDocument();
    });
  });
});
