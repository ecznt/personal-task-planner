import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from './login-form';

const mocks = vi.hoisted(() => ({
  createAuthSession: vi.fn(),
  getAuthCsrf: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams('returnTo=%2Fapp%2Ftoday'),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  createAuthSession: mocks.createAuthSession,
  getAuthCsrf: mocks.getAuthCsrf,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthCsrf.mockResolvedValue({
      data: { data: { expiresAt: '2099-01-01T00:00:00.000Z', token: 'csrf-token' } },
    });
    mocks.createAuthSession.mockResolvedValue({
      data: {
        data: {
          absoluteExpiresAt: '2099-01-07T00:00:00.000Z',
          authenticated: true,
          email: 'user@example.com',
          idleExpiresAt: '2099-01-01T12:00:00.000Z',
          next: '/app/today',
        },
      },
    });
  });

  it('submits credentials with CSRF through the generated client', async () => {
    const user = userEvent.setup();
    const { container } = renderLoginForm();

    await user.type(screen.getByLabelText('E-posta'), 'user@example.com');
    await user.type(screen.getByLabelText('Parola'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Oturum aç' }));

    await waitFor(() =>
      expect(mocks.createAuthSession).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'user@example.com',
            password: 'correct-password',
            returnTo: '/app/today',
          },
          headers: { 'X-CSRF-Token': 'csrf-token' },
        }),
      ),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/app/today');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('keeps client-side errors associated with their fields', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText('E-posta'), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Oturum aç' }));

    expect(await screen.findByText('Geçerli bir e-posta adresi girin.')).toBeVisible();
    expect(screen.getByText('Parola zorunludur.')).toBeVisible();
    expect(mocks.createAuthSession).not.toHaveBeenCalled();
  });
});

function renderLoginForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}
