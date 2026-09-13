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
  },
}));

import { beforeEach } from 'vitest';
import { apiClient } from '@planner/api-client';
import { SearchView } from './search-view';

const mockedApiClient = vi.mocked(apiClient);

beforeEach(() => {
  mocks.searchParams = new URLSearchParams('');
  mocks.replace.mockClear();
  mockedApiClient.get.mockClear();
});

function renderSearchView() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SearchView />
    </QueryClientProvider>,
  );
}

describe('SearchView', () => {
  it('sends URL filters with the search query', async () => {
    mocks.searchParams = new URLSearchParams(
      'q=rapor&status=IN_PROGRESS&areaId=area-1&dateState=overdue',
    );
    mockedApiClient.get.mockImplementation(({ url }) =>
      Promise.resolve(
        url === '/api/v1/search/tasks'
          ? {
              data: {
                data: [
                  {
                    id: 'task-1',
                    title: 'Rapor Teslim',
                    descriptionSnippet: null,
                    priority: 'HIGH',
                    canonicalStatus: 'IN_PROGRESS',
                    plannedAt: null,
                    dueAt: null,
                    areaId: 'area-1',
                    version: 1,
                    score: 10,
                  },
                ],
                page: { hasMore: false },
              },
              error: undefined,
            }
          : { data: { data: [] }, error: undefined },
      ),
    );

    renderSearchView();

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/search/tasks',
        query: expect.objectContaining({
          q: 'rapor',
          limit: '20',
          areaId: 'area-1',
          canonicalStatus: 'IN_PROGRESS',
          dateState: 'overdue',
          timezone: expect.any(String),
        }),
      });
    });

    expect(await screen.findByText('Rapor Teslim')).toBeInTheDocument();
  });

  it('preserves existing filters when the search URL is rewritten', async () => {
    mocks.searchParams = new URLSearchParams('q=rapor');
    mockedApiClient.get.mockImplementation(({ url }) =>
      Promise.resolve(
        url === '/api/v1/areas'
          ? { data: { data: [{ id: 'area-1', name: 'İş' }] }, error: undefined }
          : {
              data: { data: [], page: { hasMore: false } },
              error: undefined,
            },
      ),
    );

    renderSearchView();

    const areaOption = await screen.findByRole('option', { name: 'İş' });
    fireEvent.change(areaOption.closest('select') as HTMLSelectElement, {
      target: { value: 'area-1' },
    });

    expect(mocks.replace).toHaveBeenCalledWith('/app/search?q=rapor&areaId=area-1', {
      scroll: false,
    });
  });
});