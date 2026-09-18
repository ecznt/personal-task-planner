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
import { KanbanBoard } from './kanban-board';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

const mockedApiClient = vi.mocked(apiClient);

const EMPTY_BOARD = {
  todo: { count: 0, tasks: [] },
  inProgress: { count: 0, tasks: [] },
  completed: { count: 0, tasks: [] },
};

const TASK = {
  id: 'task-1',
  title: 'Test Görevi',
  priority: 'HIGH',
  canonicalStatus: 'TO_DO',
  dueAt: '2026-09-20T00:00:00.000Z',
  plannedAt: null,
  lifecycleState: 'ACTIVE',
  version: 1,
  areaId: 'area-1',
  labels: [{ id: 'label-1', name: 'Ev' }],
  project: { id: 'project-1', name: 'Proje' },
  areaName: 'İş',
};

beforeEach(() => {
  mocks.searchParams = new URLSearchParams('');
  mocks.replace.mockClear();
  mockedApiClient.get.mockClear();
  mockedApiClient.post.mockClear();
});

function mockLookups() {
  mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
    Promise.resolve(
      url === '/api/v1/areas'
        ? { data: { data: [{ id: 'area-1', name: 'İş' }] }, error: undefined }
        : url === '/api/v1/labels'
          ? { data: { data: [{ id: 'label-1', name: 'Ev' }] }, error: undefined }
          : url === '/api/v1/projects'
            ? { data: { data: [{ id: 'project-1', name: 'Proje' }] }, error: undefined }
            : { data: EMPTY_BOARD, error: undefined },
    ),
  );
}

function renderKanbanBoard(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskInspectorProvider>
        <KanbanBoard />
      </TaskInspectorProvider>
    </QueryClientProvider>,
  );
}

describe('KanbanBoard', () => {
  it('renders three columns', async () => {
    mockLookups();

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Yapılacak/)).toBeInTheDocument();
      expect(screen.getByText(/Devam Ediyor/)).toBeInTheDocument();
      expect(screen.getByText(/Tamamlandı/)).toBeInTheDocument();
    });
  });

  it('renders tasks in columns', async () => {
    mockLookups();
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === '/api/v1/tasks/kanban'
          ? {
              data: {
                todo: { count: 1, tasks: [TASK] },
                inProgress: { count: 0, tasks: [] },
                completed: { count: 0, tasks: [] },
              },
              error: undefined,
            }
          : url === '/api/v1/areas'
            ? { data: { data: [{ id: 'area-1', name: 'İş' }] }, error: undefined }
            : { data: { data: [] }, error: undefined },
      ),
    );

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText('Test Görevi')).toBeInTheDocument();
      expect(screen.getByText('Proje')).toBeInTheDocument();
      expect(screen.getByText('#Ev')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    mockLookups();

    renderKanbanBoard();

    await waitFor(() => {
      expect(screen.getByText(/Henüz Kanban/)).toBeInTheDocument();
    });
  });

  it('sends URL filters as query params', async () => {
    mocks.searchParams = new URLSearchParams('q=rapor&areaId=area-1&priority=HIGH&label=label-1');
    mockedApiClient.get.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve(
        url === '/api/v1/tasks/kanban'
          ? { data: EMPTY_BOARD, error: undefined }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderKanbanBoard();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/tasks/kanban',
        query: expect.objectContaining({
          q: 'rapor',
          areaId: 'area-1',
          priority: 'HIGH',
          labelId: 'label-1',
        }),
      });
    });
  });

  it('debounces the search into the URL', async () => {
    mockLookups();

    renderKanbanBoard();

    const input = await screen.findByLabelText('Görevlerde ara');
    fireEvent.change(input, { target: { value: 'z' } });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/app/kanban?q=z', { scroll: false });
    });
  });
});
