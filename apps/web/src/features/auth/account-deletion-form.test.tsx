import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDeletionForm } from './account-deletion-form';

const mocks = vi.hoisted(() => ({
  getAuthCsrf: vi.fn(),
  getCurrentUser: vi.fn(),
  initiateAccountDeletion: vi.fn(),
  navigate: vi.fn(),
  reauthenticate: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getAuthCsrf: mocks.getAuthCsrf,
  getCurrentUser: mocks.getCurrentUser,
  initiateAccountDeletion: mocks.initiateAccountDeletion,
  reauthenticate: mocks.reauthenticate,
}));

describe('AccountDeletionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthCsrf.mockResolvedValue({
      data: { data: { expiresAt: '2099-01-01T00:00:00.000Z', token: 'csrf-token' } },
    });
    mocks.getCurrentUser.mockResolvedValue({
      data: {
        data: {
          accountLifecycleState: 'ACTIVE',
          email: 'user@example.com',
          id: '018f9f7c-0000-7000-8000-000000000001',
          inAppReminderNotificationsEnabled: true,
          onboardingState: 'PENDING',
          timeZone: 'UTC',
        },
      },
      response: {
        headers: new Headers({
          etag: '"safe-user-etag"',
        }),
      },
    });
    mocks.reauthenticate.mockResolvedValue({
      data: {
        data: {
          action: 'ACCOUNT_DELETION',
          expiresAt: '2099-01-01T00:15:00.000Z',
          status: 'REAUTHENTICATED',
        },
      },
    });
    mocks.initiateAccountDeletion.mockResolvedValue({
      data: {
        data: {
          accessRevokedAt: '2099-01-01T00:00:00.000Z',
          primaryPurgePending: true,
          processId: '018f9f7c-0000-7000-8000-000000000099',
          requestedAt: '2099-01-01T00:00:00.000Z',
          state: 'PENDING_PRIMARY_PURGE',
        },
      },
    });
  });

  it('reauthenticates and initiates account deletion with CSRF, ETag and idempotency', async () => {
    const user = userEvent.setup();
    const { container } = renderAccountDeletionForm();

    expect(await screen.findByText(/user@example.com hesabı için/)).toBeVisible();
    await user.type(screen.getByLabelText('Parolanız'), 'correct password');
    await user.type(screen.getByLabelText('Onay metni: DELETE_MY_ACCOUNT'), 'DELETE_MY_ACCOUNT');
    await user.click(
      screen.getByLabelText(
        'Hesap silme işleminin kalıcı olduğunu ve erişimin hemen kapatılacağını anlıyorum.',
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Hesabımı sil' }));

    await waitFor(() =>
      expect(mocks.reauthenticate).toHaveBeenCalledWith({
        body: {
          action: 'ACCOUNT_DELETION',
          password: 'correct password',
        },
        client: {},
        headers: {
          'X-CSRF-Token': 'csrf-token',
        },
      }),
    );
    expect(mocks.initiateAccountDeletion).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          acknowledgedPermanentDeletion: true,
          confirmation: 'DELETE_MY_ACCOUNT',
        },
        headers: {
          'Idempotency-Key': expect.any(String),
          'If-Match': '"safe-user-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      }),
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/account-deletion-started');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('keeps the user on the form when reauthentication fails', async () => {
    const user = userEvent.setup();
    mocks.reauthenticate.mockResolvedValueOnce({
      error: {
        detail: 'Kimliğiniz doğrulanamadı.',
      },
    });
    renderAccountDeletionForm();

    await screen.findByText(/user@example.com hesabı için/);
    await user.type(screen.getByLabelText('Parolanız'), 'wrong password');
    await user.type(screen.getByLabelText('Onay metni: DELETE_MY_ACCOUNT'), 'DELETE_MY_ACCOUNT');
    await user.click(
      screen.getByLabelText(
        'Hesap silme işleminin kalıcı olduğunu ve erişimin hemen kapatılacağını anlıyorum.',
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Hesabımı sil' }));

    expect(await screen.findByText('Hesap silme başlatılamadı')).toBeVisible();
    expect(mocks.initiateAccountDeletion).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

function renderAccountDeletionForm(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountDeletionForm navigate={mocks.navigate} />
    </QueryClientProvider>,
  );
}
