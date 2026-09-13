import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));
vi.mock('@/features/auth/auth-api', () => ({
  apiError: () => new Error('error'),
  csrfQueryKey: ['csrf'],
  fetchCsrf: vi.fn().mockResolvedValue({ token: 'csrf-token' }),
}));

import { apiClient } from '@planner/api-client';
import { ProjectList } from './project-list';

const mockedApiClient = vi.mocked(apiClient);

function renderProjectList(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectList />
    </QueryClientProvider>,
  );
}

describe('ProjectList', () => {
  it('groups projects under their areas with counts', async () => {
    mockedApiClient.get.mockImplementation(({ url }) => {
      if (url === '/api/v1/areas') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'area-1',
                name: 'İş',
                lifecycleState: 'ACTIVE',
                taskCount: 5,
                projectCount: 1,
                overdueTaskCount: 0,
              },
              {
                id: 'area-2',
                name: 'Kişisel',
                lifecycleState: 'ACTIVE',
                taskCount: 2,
                projectCount: 1,
                overdueTaskCount: 0,
              },
            ],
          },
          error: undefined,
        });
      }

      return Promise.resolve({
        data: {
          data: [
            {
              id: 'project-1',
              areaId: 'area-1',
              name: 'Teslimat',
              lifecycleState: 'ACTIVE',
              version: 1,
              taskCount: 4,
              completedTaskCount: 2,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'project-2',
              areaId: 'area-2',
              name: 'Ev Tadilatı',
              lifecycleState: 'ACTIVE',
              version: 1,
              taskCount: 2,
              completedTaskCount: 0,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
        error: undefined,
      });
    });

    renderProjectList();

    await screen.findByText('Teslimat');

    expect(screen.getByRole('link', { name: 'İş' })).toHaveAttribute('href', '/app/areas/area-1');
    expect(screen.getByRole('link', { name: /Teslimat/ })).toHaveAttribute(
      'href',
      '/app/projects/project-1',
    );
    expect(screen.getByText(/4 görev/)).toBeInTheDocument();
    expect(screen.getByText(/2 tamamlandı/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kişisel' })).toHaveAttribute(
      'href',
      '/app/areas/area-2',
    );
    expect(screen.getByRole('link', { name: /Ev Tadilatı/ })).toHaveAttribute(
      'href',
      '/app/projects/project-2',
    );
  });

  it('renders the new project form with an area selector', async () => {
    mockedApiClient.get.mockImplementation(({ url }) =>
      Promise.resolve({
        data: {
          data: url === '/api/v1/areas' ? [{ id: 'area-1', name: 'İş', lifecycleState: 'ACTIVE', taskCount: 0, projectCount: 0, overdueTaskCount: 0 }] : [],
        },
        error: undefined,
      }),
    );

    renderProjectList();

    await screen.findByText('Yeni Proje');
    expect(screen.getByText('Alan seçin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Proje adı')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    mockedApiClient.get.mockImplementation(({ url }) =>
      Promise.resolve({
        data: {
          data: url === '/api/v1/areas' ? [] : [],
        },
        error: undefined,
      }),
    );

    const { container } = renderProjectList();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});