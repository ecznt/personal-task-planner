import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailVerificationForm } from './email-verification-form';

const mocks = vi.hoisted(() => ({
  getAuthCsrf: vi.fn(),
  requestEmailVerification: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getAuthCsrf: mocks.getAuthCsrf,
  requestEmailVerification: mocks.requestEmailVerification,
  verifyEmail: mocks.verifyEmail,
}));

describe('EmailVerificationForm', () => {
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
    mocks.verifyEmail.mockResolvedValue({
      data: {
        data: {
          next: '/login',
          status: 'VERIFIED',
        },
      },
    });
    mocks.requestEmailVerification.mockResolvedValue({
      data: {
        data: {
          status: 'VERIFICATION_EMAIL_SENT_IF_ELIGIBLE',
        },
      },
    });
  });

  it('submits the email and manual code with CSRF and an idempotency key', async () => {
    const user = userEvent.setup();
    const { container } = renderVerificationForm();

    await user.type(screen.getByLabelText('E-posta'), 'user@example.com');
    await user.type(screen.getByLabelText('8 haneli doğrulama kodu'), '12345678');
    await user.click(screen.getByRole('button', { name: 'E-postayı doğrula' }));

    await waitFor(() => {
      expect(mocks.verifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            code: '12345678',
            email: 'user@example.com',
          },
          headers: {
            'Idempotency-Key': expect.any(String),
            'X-CSRF-Token': 'csrf-token',
          },
        }),
      );
    });
    expect(await screen.findByText('E-posta doğrulandı')).toBeVisible();
    expect(screen.getByRole('link', { name: /oturum aç/i })).toHaveAttribute('href', '/login');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('uses a generic resend message and validates email before requesting a code', async () => {
    const user = userEvent.setup();
    renderVerificationForm();

    await user.click(screen.getByRole('button', { name: 'Yeni kod gönder' }));
    expect(await screen.findByText('E-posta adresi zorunludur.')).toBeVisible();
    expect(mocks.requestEmailVerification).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('E-posta'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Yeni kod gönder' }));

    await waitFor(() => {
      expect(mocks.requestEmailVerification).toHaveBeenCalledWith(
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
        'Hesap doğrulamaya uygunsa yeni kod e-posta adresine gönderilecektir.',
      ),
    ).toBeVisible();
  });
});

function renderVerificationForm() {
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

  return render(
    <QueryClientProvider client={queryClient}>
      <EmailVerificationForm />
    </QueryClientProvider>,
  );
}
