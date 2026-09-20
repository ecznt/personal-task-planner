import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  authCsrf: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
    post: (...args: unknown[]) => mocks.apiPost(...args),
  },
  getAuthCsrf: (...args: unknown[]) => mocks.authCsrf(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
  },
}));

import { QuickCreateDialog } from './quick-create-dialog';

const INBOX_AREA = { id: 'area-inbox', name: 'Gelen Kutusu', isInbox: true };
const WORK_AREA = { id: 'area-work', name: 'İş', isInbox: false };
const PROJECT = {
  id: 'proj-1',
  areaId: 'area-work',
  name: 'Yazilim',
  lifecycleState: 'ACTIVE',
};
const LABEL = { id: 'lbl-1', name: 'is' };

function renderDialog() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <QuickCreateDialog triggerLabel="Yeni görev" />
    </QueryClientProvider>,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  renderDialog();
  await user.click(screen.getByRole('button', { name: 'Yeni görev' }));
  await screen.findByRole('tab', { name: 'Hızlı ekle', selected: true });
  return user;
}

function postedBody(): Record<string, unknown> {
  const [args] = mocks.apiPost.mock.calls[0] as unknown as [
    { url: string; body: Record<string, unknown> },
  ];
  return args.body;
}

describe('QuickCreateDialog', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
    mocks.authCsrf.mockReset();
    mocks.toastSuccess.mockReset();

    mocks.apiGet.mockImplementation((options: { url?: string } = {}) => {
      const url = options.url;
      if (url === '/api/v1/areas') {
        return Promise.resolve({
          data: { data: [INBOX_AREA, WORK_AREA] },
          error: undefined,
        });
      }
      if (url === '/api/v1/projects') {
        return Promise.resolve({ data: { data: [PROJECT] }, error: undefined });
      }
      if (url === '/api/v1/labels') {
        return Promise.resolve({ data: { data: [LABEL] }, error: undefined });
      }
      return Promise.resolve({ data: { data: [] }, error: undefined });
    });

    mocks.authCsrf.mockResolvedValue({
      data: {
        data: { token: 'csrf-token', expiresAt: '2026-09-15T10:00:00Z' },
      },
      error: undefined,
    });
  });

  it('resolves #project and @label, strips them from the title and posts plannedAt priority area', async () => {
    const user = await openDialog();
    mocks.apiPost.mockResolvedValue({
      data: { data: { id: 'task-1' } },
      error: undefined,
    });

    await user.type(
screen.getByRole('textbox', { name: 'Hızlı ekle' }),
      'Rapor 25 aralık 2027 14:30 p1 #Yazilim @is',
    );

    expect(await screen.findByText('Proje:')).toBeInTheDocument();
    expect(screen.getByText('Yazilim')).toBeInTheDocument();
    expect(screen.getByText('Etiket:')).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Ekle' });
    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
    await user.click(submit);

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledTimes(1);
    });

    expect(postedBody()).toEqual({
      title: 'Rapor',
      areaId: 'area-work',
      projectId: 'proj-1',
      labelIds: ['lbl-1'],
      plannedAt: new Date(2027, 11, 25, 14, 30).toISOString(),
      priority: 'HIGH',
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('keeps unresolved shorthand in the title and falls back to the inbox area', async () => {
    const user = await openDialog();
    mocks.apiPost.mockResolvedValue({
      data: { data: { id: 'task-2' } },
      error: undefined,
    });

    await user.type(screen.getByRole('textbox', { name: 'Hızlı ekle' }), 'Not #Yok @bilinmeyen');

    expect(
      await screen.findByText("Proje '#Yok' bulunamadı, başlıkta korundu."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Etiket '@bilinmeyen' bulunamadı, başlıkta korundu."),
    ).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Ekle' });
    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
    await user.click(submit);

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledTimes(1);
    });

    expect(postedBody()).toEqual({
      title: 'Not #Yok @bilinmeyen',
      areaId: 'area-inbox',
    });
  });

  it('rejects a capture that resolves to an empty title', async () => {
    const user = await openDialog();

    await user.type(screen.getByRole('textbox', { name: 'Hızlı ekle' }), '25 aralık 2027 14:30 p1');

    const submit = screen.getByRole('button', { name: 'Ekle' });
    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
    await user.click(submit);

    expect(screen.getByText('Görev başlığı girin.')).toBeInTheDocument();
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });
});
