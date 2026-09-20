import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/features/auth/auth-api', () => ({
  apiError: () => new Error('error'),
  csrfQueryKey: ['csrf'],
  fetchCsrf: vi.fn().mockResolvedValue({ token: 'csrf-token' }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { apiClient } from '@planner/api-client';
import { TemplateList } from './template-list';

const mockedApiClient = vi.mocked(apiClient);

const TEMPLATES = [
  {
    id: 'template-1',
    title: 'Haftalık Rapor',
    description: 'Haftalık ilerleme raporunu hazırla',
    priority: 'HIGH',
    checklistSteps: ['Veri topla', 'Rapor yaz'],
    labelNames: ['İş'],
    version: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'template-2',
    title: 'Market Alışverişi',
    description: null,
    priority: 'LOW',
    checklistSteps: [],
    labelNames: [],
    defaultPlannedAtOffsetDays: 2,
    version: 3,
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

function mockGetTemplates() {
  mockedApiClient.get.mockImplementation(({ url }) => {
    if (url === '/api/v1/task-templates') {
      return Promise.resolve({ data: { data: TEMPLATES }, error: undefined });
    }
    return Promise.resolve({
      data: {
        data: [
          { id: 'area-1', name: 'İş', lifecycleState: 'ACTIVE', taskCount: 0, projectCount: 0, overdueTaskCount: 0 },
          { id: 'area-2', name: 'Kişisel', lifecycleState: 'ACTIVE', taskCount: 0, projectCount: 0, overdueTaskCount: 0 },
        ],
      },
      error: undefined,
    });
  });
}

function renderTemplates(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TemplateList />
    </QueryClientProvider>,
  );
}

describe('TemplateList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists templates with priority, steps and labels', async () => {
    mockGetTemplates();

    renderTemplates();

    expect(await screen.findByText('Haftalık Rapor')).toBeInTheDocument();
    expect(screen.getByText('Yüksek')).toBeInTheDocument();
    expect(screen.getByText('2 onay adımı')).toBeInTheDocument();
    expect(screen.getByText('@İş')).toBeInTheDocument();
    expect(screen.getByText('Market Alışverişi')).toBeInTheDocument();
    expect(screen.getByText('+2 gün')).toBeInTheDocument();
    expect(screen.getByText('0 onay adımı')).toBeInTheDocument();
  });

  it('creates a new template from the form', async () => {
    mockGetTemplates();
    mockedApiClient.post.mockResolvedValue({
      data: { data: TEMPLATES[0] },
      error: undefined,
    });
    const user = userEvent.setup();

    renderTemplates();

    await user.click(await screen.findByRole('button', { name: 'Yeni şablon' }));

    await user.type(screen.getByLabelText('Şablon adı'), 'Toplantı Notları');
    await user.type(screen.getByLabelText('Etiketler (virgülle ayırın)'), 'toplantı, iş');
    await user.click(screen.getByRole('button', { name: 'Şablonu kaydet' }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/task-templates',
          body: expect.objectContaining({
            title: 'Toplantı Notları',
            labelNames: ['toplantı', 'iş'],
            priority: 'MEDIUM',
          }),
          headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
        }),
      );
    });
  });

  it('applies a template and creates a task', async () => {
    mockGetTemplates();
    mockedApiClient.post.mockResolvedValue({
      data: { data: { id: 'task-1' } },
      error: undefined,
    });
    const user = userEvent.setup();

    renderTemplates();

    const applyButtons = await screen.findAllByRole('button', { name: 'Uygula' });
    expect(applyButtons[0]).toBeDefined();
    await user.click(applyButtons[0] as HTMLElement);

    expect(screen.getByText('Şablondan görev oluştur')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Görevi oluştur' }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/task-templates/{templateId}/apply',
          path: { templateId: 'template-1' },
        }),
      );
    });
  });

  it('deletes a template with If-Match header', async () => {
    mockGetTemplates();
    mockedApiClient.delete.mockResolvedValue({
      data: undefined,
      error: undefined,
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderTemplates();

    const deleteButton = await screen.findByRole('button', {
      name: 'Haftalık Rapor şablonunu sil',
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/task-templates/{templateId}',
          path: { templateId: 'template-1' },
          headers: expect.objectContaining({ 'If-Match': '1' }),
        }),
      );
    });

    confirmSpy.mockRestore();
  });

  it('has no accessibility violations', async () => {
    mockGetTemplates();

    const { container } = renderTemplates();
    await screen.findByText('Haftalık Rapor');

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});