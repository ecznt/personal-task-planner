import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { axe } from 'vitest-axe';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { TaskFilterBar } from './task-filter-bar';
import type { TaskFilters } from './url-task-filters';

const mockedApiClient = vi.mocked(apiClient);

function mockData() {
  mockedApiClient.get.mockImplementation(({ url, query }) => {
    if (url === '/api/v1/areas') {
      return Promise.resolve({
        data: {
          data: [
            { id: 'area-1', name: 'İş' },
            { id: 'area-2', name: 'Kişisel' },
          ],
        },
        error: undefined,
      });
    }

    if (url === '/api/v1/projects') {
      const areaId = (query as { areaId?: string }).areaId;
      return Promise.resolve({
        data: {
          data:
            areaId === 'area-1'
              ? [{ id: 'project-1', areaId, name: 'Teslimat' }]
              : [],
        },
        error: undefined,
      });
    }

    if (url === '/api/v1/labels') {
      return Promise.resolve({
        data: {
          data: [
            { id: 'label-1', name: 'Acil' },
            { id: 'label-2', name: 'Ev' },
          ],
        },
        error: undefined,
      });
    }

    return Promise.resolve({ data: { data: [] }, error: undefined });
  });
}

function renderBar(filters: TaskFilters = {}) {
  const onChangeFn = vi.fn();
  const onClearAllFn = vi.fn();
  const result = render(
    <QueryClientProvider client={new QueryClient()}>
      <TaskFilterBar filters={filters} onChange={onChangeFn} onClearAll={onClearAllFn} />
    </QueryClientProvider>,
  );
  return { ...result, onChangeFn, onClearAllFn };
}

describe('TaskFilterBar', () => {
  it('disables project select when no area is active', async () => {
    mockData();
    const { container } = renderBar();

    await screen.findByText('İş');

    expect(screen.getByLabelText('Proje:')).toBeDisabled();

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('scopes projects to the selected area', async () => {
    mockData();
    renderBar({ areaId: 'area-1' });

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith({
        url: '/api/v1/projects',
        query: { areaId: 'area-1' },
      });
    });

    expect(await screen.findByRole('option', { name: 'Teslimat' })).toBeInTheDocument();
  });

  it('clears the project when the area changes', async () => {
    mockData();
    const { onChangeFn } = renderBar({ areaId: 'area-1', projectId: 'project-1' });

    await screen.findByText('İş');

    fireEvent.change(screen.getByLabelText('Alan:'), { target: { value: 'area-2' } });

    expect(onChangeFn).toHaveBeenCalledWith('areaId', 'area-2');
    expect(onChangeFn).toHaveBeenCalledWith('projectId', undefined);
  });

  it('calls onClearAll when Temizle is clicked', async () => {
    mockData();
    const { onClearAllFn } = renderBar({ areaId: 'area-1', canonicalStatus: 'TO_DO' });

    const clearButton = await screen.findByRole('button', { name: /Temizle/ });
    clearButton.click();

    expect(onClearAllFn).toHaveBeenCalledTimes(1);
  });
});