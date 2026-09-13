import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));
vi.mock('@/features/auth/auth-api', () => ({
  apiError: () => new Error('error'),
  csrfQueryKey: ['csrf'],
  fetchCsrf: vi.fn().mockResolvedValue({ token: 'csrf-token' }),
}));

import { apiClient } from '@planner/api-client';
import { ProjectDetail } from './project-detail';

const mockedApiClient = vi.mocked(apiClient);

function mockDefaultApi() {
  mockedApiClient.get.mockImplementation(({ url, path, query }) => {
    if (url === '/api/v1/projects/{projectId}') {
      return Promise.resolve({
        data: {
          data: {
            id: path?.projectId ?? 'project-1',
            areaId: 'area-1',
            name: 'Teslimat',
            lifecycleState: 'ACTIVE',
            version: 3,
            taskCount: 4,
            completedTaskCount: 2,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
        error: undefined,
      });
    }

    if (url === '/api/v1/areas') {
      return Promise.resolve({
        data: {
          data: [
            { id: 'area-1', name: 'İş', lifecycleState: 'ACTIVE', taskCount: 5, projectCount: 1, overdueTaskCount: 0 },
            { id: 'area-2', name: 'Kişisel', lifecycleState: 'ACTIVE', taskCount: 2, projectCount: 1, overdueTaskCount: 0 },
          ],
        },
        error: undefined,
      });
    }

    if (url === '/api/v1/tasks' && query?.projectId === 'project-1') {
      return Promise.resolve({ data: { data: [] }, error: undefined });
    }

    return Promise.resolve({ data: { data: [] }, error: undefined });
  });
}

function renderProjectDetail(projectId = 'project-1', queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectDetail projectId={projectId} />
    </QueryClientProvider>,
  );
}

describe('ProjectDetail', () => {
  it('renders project header, owning area link, and counts', async () => {
    mockDefaultApi();

    renderProjectDetail();

    expect(await screen.findByRole('heading', { name: 'Teslimat' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'İş' })).toHaveAttribute('href', '/app/areas/area-1');
    expect(screen.getByText(/4 görev/)).toBeInTheDocument();
    expect(screen.getByText(/2 tamamlandı/)).toBeInTheDocument();
  });

  it('renders move-to-area selector excluding the current area', async () => {
    mockDefaultApi();

    renderProjectDetail();

    await screen.findByRole('heading', { name: 'Teslimat' });
    expect(screen.getByLabelText('Başka alana taşı:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kişisel' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'İş' })).not.toBeInTheDocument();
  });

  it('renders embedded task list filtered to the project', async () => {
    mockDefaultApi();

    renderProjectDetail();

    await screen.findByRole('heading', { name: 'Teslimat' });
    await screen.findByLabelText('Sırala:');
    expect(screen.queryByRole('heading', { name: 'Görevler' })).not.toBeInTheDocument();
  });

  it('renders a labeled quick create trigger', async () => {
    mockDefaultApi();

    renderProjectDetail();

    expect(await screen.findByRole('button', { name: 'Yeni Görev' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    mockDefaultApi();

    const { container } = renderProjectDetail();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});