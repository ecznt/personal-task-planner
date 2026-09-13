import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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
  },
}));

import { apiClient } from '@planner/api-client';
import { beforeEach } from 'vitest';
import { GlobalTaskList } from './global-task-list';

const mockedApiClient = vi.mocked(apiClient);

beforeEach(() => {
  mocks.searchParams = new URLSearchParams('');
  mocks.replace.mockClear();
  mockedApiClient.get.mockClear();
});

function renderGlobalTaskList(
  queryClient = new QueryClient(),
  props: { projectId?: string; embedded?: boolean } = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <GlobalTaskList {...props} />
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

  it('shows filter controls and filter bar', async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(screen.getByLabelText('Sırala:')).toBeInTheDocument();
      expect(screen.getByLabelText('Alan:')).toBeInTheDocument();
      expect(screen.getByLabelText('Durum:')).toBeInTheDocument();
      expect(screen.getByLabelText('Öncelik:')).toBeInTheDocument();
      expect(screen.getByLabelText('Tarih:')).toBeInTheDocument();
      expect(screen.getByLabelText('Etiket:')).toBeInTheDocument();
    });
  });

  it('sends URL filters as task query parameters', async () => {
    mocks.searchParams = new URLSearchParams(
      'areaId=area-1&projectId=project-9&status=TO_DO&priority=HIGH&label=label-3&dateState=dueToday',
    );
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/tasks',
        query: expect.objectContaining({
          sort: 'plannedDate',
          order: 'asc',
          limit: '50',
          areaId: 'area-1',
          projectId: 'project-9',
          canonicalStatus: 'TO_DO',
          priority: 'HIGH',
          labelId: 'label-3',
          dateState: 'dueToday',
        }),
      });
    });
  });

  it('sends timezone alongside dateState', async () => {
    mocks.searchParams = new URLSearchParams('dateState=upcoming');
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/tasks',
        query: expect.objectContaining({
          dateState: 'upcoming',
          timezone: expect.any(String),
        }),
      });
    });
  });

  it('ignores invalid URL filter values', async () => {
    mocks.searchParams = new URLSearchParams('status=INVALID&dateState=bogus&areaId=area-1');
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/tasks',
        query: expect.objectContaining({
          areaId: 'area-1',
        }),
      });
    });

    const call = mockedApiClient.get.mock.calls.find(([args]) => args.url === '/api/v1/tasks');
    if (call === undefined) throw new Error('tasks call missing');
    expect((call[0] as { query: Record<string, string> }).query.canonicalStatus).toBeUndefined();
    expect((call[0] as { query: Record<string, string> }).query.dateState).toBeUndefined();
  });

  it('clears all filters on Temizle', async () => {
    mocks.searchParams = new URLSearchParams('areaId=area-1&status=TO_DO');
    mockedApiClient.get.mockResolvedValue({
      data: { data: [] },
      error: undefined,
    });

    renderGlobalTaskList();

    const clearButton = await screen.findByRole('button', { name: /Temizle/ });
    clearButton.click();

    expect(mocks.replace).toHaveBeenCalledWith('/app/tasks', { scroll: false });
  });

  it('keeps local filters for embedded project lists', async () => {
    mocks.searchParams = new URLSearchParams('');
    mockedApiClient.get.mockResolvedValue({ data: { data: [] }, error: undefined });

    renderGlobalTaskList(new QueryClient(), { projectId: 'project-1', embedded: true });

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/tasks',
        query: expect.objectContaining({ projectId: 'project-1', limit: '50' }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Alan:')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Durum:')).toBeInTheDocument();
      expect(screen.getByLabelText('Öncelik:')).toBeInTheDocument();
    });
  });
});