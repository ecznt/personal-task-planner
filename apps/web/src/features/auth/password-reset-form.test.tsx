import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PasswordResetRequestForm } from './password-reset-request-form';
import { ResetPasswordForm } from './reset-password-form';

const mocks = vi.hoisted(() => ({
  getAuthCsrf: vi.fn(),
  replace: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getAuthCsrf: mocks.getAuthCsrf,
  requestPasswordReset: mocks.requestPasswordReset,
  resetPassword: mocks.resetPassword,
}));

describe('PasswordResetRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthCsrf.mockResolvedValue({
      data: {
        data: {
          expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
          token: 'csrf-token',
        },
      },
    });
    mocks.requestPasswordReset.mockResolvedValue({
      data: {
        data: {
          status: 'PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE',
        },
      },
    });
  });

  it('submits a generic password reset request with CSRF', async () => {
    const user = userEvent.setup();
    const { container } = renderWithClient(<PasswordResetRequestForm />);

    await user.type(screen.getByLabelText('E-posta'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }));

    await waitFor(() => {
      expect(mocks.requestPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'user@example.com',
          },
          headers: {
            'X-CSRF-Token': 'csrf-token',
          },
        }),
      );
    });
    expect(
      await screen.findByText(
        'Hesap parola sıfırlamaya uygunsa bağlantı e-posta adresine gönderilecektir.',
      ),
    ).toBeVisible();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(
      null,
      '',
      '/reset-password#token=abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
    );
    mocks.getAuthCsrf.mockResolvedValue({
      data: {
        data: {
          expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
          token: 'csrf-token',
        },
      },
    });
    mocks.resetPassword.mockResolvedValue({
      data: undefined,
    });
  });

  it('submits the fragment token in the body and clears it from the URL', async () => {
    const user = userEvent.setup();
    const { container } = renderWithClient(<ResetPasswordForm />);

    await waitFor(() => expect(window.location.hash).toBe(''));
    await user.type(screen.getByLabelText('Yeni parola'), 'a changed password');
    await user.type(screen.getByLabelText('Yeni parola tekrarı'), 'a changed password');
    await user.click(screen.getByRole('button', { name: 'Yeni parolayı kaydet' }));

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            password: 'a changed password',
            passwordConfirmation: 'a changed password',
            token: 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
          },
          headers: {
            'Idempotency-Key': expect.any(String),
            'X-CSRF-Token': 'csrf-token',
          },
        }),
      );
    });
    expect(mocks.replace).toHaveBeenCalledWith('/login?passwordReset=1');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('shows a safe invalid-link state when the token is missing', async () => {
    window.history.replaceState(null, '', '/reset-password');
    renderWithClient(<ResetPasswordForm />);

    expect(await screen.findByText('Bağlantı geçersiz')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Bağlantı gönder' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
