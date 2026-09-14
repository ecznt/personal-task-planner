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

import { DayQuickCreateDialog } from './day-quick-create-dialog';

function renderDialog(dateKey: string, onClose = vi.fn()) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <DayQuickCreateDialog dateKey={dateKey} onClose={onClose} />
    </QueryClientProvider>,
  );
}

describe('DayQuickCreateDialog', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
    mocks.authCsrf.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.authCsrf.mockResolvedValue({
      data: {
        data: { token: 'csrf-token', expiresAt: '2026-09-14T10:00:00Z' },
      },
      error: undefined,
    });
  });

  it('prefills plannedAt from the selected date at 09:00', () => {
    renderDialog('2026-09-14');

    expect(screen.getByRole('heading', { name: 'Yeni görev' })).toBeInTheDocument();
    expect(screen.getByLabelText('Başlangıç Tarihi')).toHaveValue('2026-09-14T09:00');
  });

  it('creates a task with plannedAt on submit', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mocks.apiPost.mockResolvedValue({
      data: { data: { id: 'task-1', title: 'Diş hekimi' } },
      error: undefined,
    });

    renderDialog('2026-09-14', onClose);

    await user.type(screen.getByLabelText('Başlık'), 'Diş hekimi');
    await user.click(screen.getByRole('button', { name: 'Oluştur' }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledTimes(1);
    });

    const [args] = mocks.apiPost.mock.calls[0] as unknown as [
      {
        url: string;
        body: Record<string, unknown>;
        headers: Record<string, string>;
      },
    ];
    expect(args.url).toBe('/api/v1/tasks');
    expect(args.body).toEqual({ title: 'Diş hekimi', plannedAt: '2026-09-14T09:00' });
    expect(args.headers['X-CSRF-Token']).toBe('csrf-token');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('rejects an empty title', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderDialog('2026-09-14', onClose);

    await user.click(screen.getByRole('button', { name: 'Oluştur' }));

    expect(screen.getByText('Görev başlığı girin.')).toBeInTheDocument();
    expect(mocks.apiPost).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
