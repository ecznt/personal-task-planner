import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(''),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { beforeEach } from 'vitest';
import { apiClient } from '@planner/api-client';
import { AreaKanbanBoard } from './area-kanban-board';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

const mockedApiClient = vi.mocked(apiClient);

beforeEach(() => {
  mocks.searchParams = new URLSearchParams('');
  mocks.replace.mockClear();
  mockedApiClient.get.mockClear();
  mockedApiClient.post.mockClear();
});

function renderAreaKanbanBoard(areaId = 'area-1', queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskInspectorProvider>
        <AreaKanbanBoard areaId={areaId} />
      </TaskInspectorProvider>
    </QueryClientProvider>,
  );
}

describe('AreaKanbanBoard', () => {
  it('renders area-specific columns', async () => {
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? {
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
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Yapılacak')).toBeInTheDocument();
      expect(screen.getByText('İnceleme')).toBeInTheDocument();
    });
  });

  it('renders tasks in columns', async () => {
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? {
              data: {
                statuses: [{ id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 }],
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
                        version: 1,
                        labels: [],
                        project: null,
                      },
                    ],
                  },
                ],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Alan Görevi')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? {
              data: {
                statuses: [{ id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 }],
                columns: [{ statusId: 's1', count: 0, tasks: [] }],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Bu alanda henüz görev yok/)).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? { data: undefined, error: { status: 500 } }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard('area-1', queryClient);

    await waitFor(() => {
      expect(screen.getByText('Kanban yüklenemedi.')).toBeInTheDocument();
    });
  });

  it('debounces the search into the URL', async () => {
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? {
              data: {
                statuses: [{ id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 }],
                columns: [{ statusId: 's1', count: 0, tasks: [] }],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard();

    const input = await screen.findByLabelText('Görevlerde ara');
    fireEvent.change(input, { target: { value: 'süt' } });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/app/areas/area-1?q=s%C3%BCt', { scroll: false });
    });
  });

  it('sends URL filters as query params', async () => {
    mocks.searchParams = new URLSearchParams('priority=HIGH&label=label-1&projectId=proj-1');
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === `/api/v1/areas/area-1/kanban`
          ? {
              data: {
                statuses: [{ id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 }],
                columns: [{ statusId: 's1', count: 0, tasks: [] }],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderAreaKanbanBoard();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: `/api/v1/areas/area-1/kanban`,
        query: { priority: 'HIGH', labelId: 'label-1', projectId: 'proj-1' },
      });
    });
  });
});
