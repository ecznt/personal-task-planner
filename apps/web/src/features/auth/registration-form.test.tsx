import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegistrationForm } from './registration-form';

const mocks = vi.hoisted(() => ({
  getAuthCsrf: vi.fn(),
  push: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getAuthCsrf: mocks.getAuthCsrf,
  registerAccount: mocks.registerAccount,
}));

describe('RegistrationForm', () => {
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
    mocks.registerAccount.mockResolvedValue({
      data: {
        data: {
          next: '/verify-email',
          status: 'VERIFICATION_REQUIRED',
        },
      },
    });
  });

  it('submits valid Turkish registration fields through the generated client', async () => {
    const user = userEvent.setup();
    const { container } = renderRegistrationForm();

    await user.type(screen.getByLabelText('E-posta'), 'user@example.com');
    await user.type(screen.getByLabelText('Parola'), 'twelve-chars!');
    await user.type(screen.getByLabelText('Parola tekrarı'), 'twelve-chars!');
    await user.click(screen.getByLabelText('Kullanım koşullarını kabul ediyorum.'));
    await user.click(screen.getByRole('button', { name: 'Hesap oluştur' }));

    await waitFor(() => {
      expect(mocks.registerAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'user@example.com',
            password: 'twelve-chars!',
            passwordConfirmation: 'twelve-chars!',
            termsAccepted: true,
          },
          headers: {
            'X-CSRF-Token': 'csrf-token',
          },
        }),
      );
    });
    expect(mocks.push).toHaveBeenCalledWith('/verify-email');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('keeps validation errors associated with their fields', async () => {
    const user = userEvent.setup();
    renderRegistrationForm();

    await user.type(screen.getByLabelText('E-posta'), 'invalid');
    await user.type(screen.getByLabelText('Parola'), 'short');
    await user.type(screen.getByLabelText('Parola tekrarı'), 'different');
    await user.click(screen.getByRole('button', { name: 'Hesap oluştur' }));

    expect(await screen.findByText('Geçerli bir e-posta adresi girin.')).toBeVisible();
    expect(screen.getByText('Parola en az 12 karakter olmalıdır.')).toBeVisible();
    expect(screen.getByText('Parolalar eşleşmiyor.')).toBeVisible();
    expect(mocks.registerAccount).not.toHaveBeenCalled();
  });

  it('links to the public terms and privacy pages from registration', () => {
    renderRegistrationForm();

    expect(screen.getByRole('link', { name: 'kullanım koşullarını' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'gizlilik açıklamasını' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });
});

function renderRegistrationForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RegistrationForm />
    </QueryClientProvider>,
  );
}
