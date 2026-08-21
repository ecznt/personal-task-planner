import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { GlobalTaskList } from './global-task-list';

const mockedApiClient = vi.mocked(apiClient);

function renderGlobalTaskList(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <GlobalTaskList />
    </QueryClientProvider>,
  );
}

describe('GlobalTaskList', () => {
  it('renders empty state when no tasks', async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(screen.getByText('Henüz görev yok.')).toBeInTheDocument();
    });
  });

  it('renders task list from API', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        data: [
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
      error: undefined,
    });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(screen.getByText('Test Görevi')).toBeInTheDocument();
    });
  });

  it('shows filter controls', async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(screen.getByLabelText('Sırala:')).toBeInTheDocument();
      expect(screen.getByLabelText('Durum:')).toBeInTheDocument();
      expect(screen.getByLabelText('Öncelik:')).toBeInTheDocument();
    });
  });
});
