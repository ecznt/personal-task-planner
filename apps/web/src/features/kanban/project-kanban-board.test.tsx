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
import { ProjectKanbanBoard } from './project-kanban-board';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

const mockedApiClient = vi.mocked(apiClient);

const PROJECT_KANBAN_URL = `/api/v1/projects/proj-1/kanban`;
const PROJECT_MOVE_URL = `/api/v1/projects/proj-1/kanban-moves`;

const BOARD = {
  statuses: [
    { id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
    { id: 's2', name: 'İnceleme', canonicalStatus: 'IN_PROGRESS', position: 2 },
  ],
  columns: [
    { statusId: 's1', count: 0, tasks: [] },
    { statusId: 's2', count: 0, tasks: [] },
  ],
};

const TASK = {
  id: 'task-1',
  title: 'Proje Görevi',
  priority: 'HIGH',
  canonicalStatus: 'TO_DO',
  dueAt: null,
  plannedAt: null,
  lifecycleState: 'ACTIVE',
  version: 3,
  labels: [],
  project: null,
};

function mockBoardLookups() {
  mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
    Promise.resolve(
      url === PROJECT_KANBAN_URL
        ? { data: BOARD, error: undefined }
        : { data: { data: [] }, error: undefined },
    ),
  );
}

function renderProjectKanbanBoard(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskInspectorProvider>
        <ProjectKanbanBoard projectId="proj-1" areaId="area-1" />
      </TaskInspectorProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocks.searchParams = new URLSearchParams('');
  mocks.replace.mockClear();
  mockedApiClient.get.mockClear();
  mockedApiClient.post.mockClear();
});

describe('ProjectKanbanBoard', () => {
  it('renders project columns and tasks', async () => {
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === PROJECT_KANBAN_URL
          ? {
              data: {
                ...BOARD,
                columns: [
                  { statusId: 's1', count: 1, tasks: [TASK] },
                  { statusId: 's2', count: 0, tasks: [] },
                ],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderProjectKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Proje Görevi')).toBeInTheDocument();
      expect(screen.getByText('Yapılacak')).toBeInTheDocument();
      expect(screen.getByText('İnceleme')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Proje:/)).not.toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    mockBoardLookups();

    renderProjectKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Bu projede henüz görev yok/)).toBeInTheDocument();
    });
  });

  it('sends URL filters as query params', async () => {
    mocks.searchParams = new URLSearchParams('priority=LOW&label=label-1');
    mockBoardLookups();

    renderProjectKanbanBoard();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: PROJECT_KANBAN_URL,
        query: { priority: 'LOW', labelId: 'label-1' },
      });
    });
  });

  it('moves a task via the arrow button with If-Match version', async () => {
    mockBoardLookups();
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === PROJECT_KANBAN_URL
          ? {
              data: {
                statuses: BOARD.statuses,
                columns: [
                  { statusId: 's1', count: 1, tasks: [TASK] },
                  { statusId: 's2', count: 0, tasks: [] },
                ],
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );
    mockedApiClient.post.mockResolvedValue({ data: { data: TASK }, error: undefined });

    renderProjectKanbanBoard();

    const button = await screen.findByRole('button', {
      name: 'Proje Görevi görevini sonraki duruma taşı',
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith({
        url: PROJECT_MOVE_URL,
        body: { taskId: 'task-1', targetAreaStatusId: 's2' },
        headers: { 'Content-Type': 'application/json', 'If-Match': '3' },
      });
    });
  });

  it('shows error state on API failure', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === PROJECT_KANBAN_URL
          ? { data: undefined, error: { status: 500 } }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderProjectKanbanBoard(queryClient);

    await waitFor(() => {
      expect(screen.getByText('Kanban yüklenemedi.')).toBeInTheDocument();
    });
  });
});
