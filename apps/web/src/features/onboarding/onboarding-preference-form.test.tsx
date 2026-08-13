import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingPreferenceForm } from './onboarding-preference-form';

const mocks = vi.hoisted(() => ({
  getAuthCsrf: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getAuthCsrf: mocks.getAuthCsrf,
  getCurrentUser: mocks.getCurrentUser,
  updateCurrentUser: mocks.updateCurrentUser,
}));

describe('OnboardingPreferenceForm', () => {
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
    mocks.updateCurrentUser.mockResolvedValue({
      data: {
        data: {
          accountLifecycleState: 'ACTIVE',
          email: 'user@example.com',
          id: '018f9f7c-0000-7000-8000-000000000001',
          inAppReminderNotificationsEnabled: true,
          onboardingState: 'PENDING',
          timeZone: 'Europe/Istanbul',
        },
      },
      response: {
        headers: new Headers({
          etag: '"updated-user-etag"',
        }),
      },
    });
  });

  it('confirms onboarding preference and persists only the current user time zone', async () => {
    const user = userEvent.setup();
    const { container } = renderOnboardingPreferenceForm();

    expect(await screen.findByText(/user@example.com hesabı için/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Başlangıç tercihi'), 'CREATE_SAMPLE_DATA');
    await user.selectOptions(screen.getByLabelText('Saat dilimi'), 'Europe/Istanbul');
    await user.click(screen.getByRole('button', { name: 'Tercihi ve saat dilimini onayla' }));

    await waitFor(() =>
      expect(mocks.updateCurrentUser).toHaveBeenCalledWith({
        body: {
          timeZone: 'Europe/Istanbul',
        },
        client: {},
        headers: {
          'If-Match': '"safe-user-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      }),
    );
    expect(await screen.findByText('Tercih ve saat dilimi onaylandı')).toBeVisible();
    expect(screen.getByText(/Seçiminiz “Örnek veri oluştur”/)).toBeVisible();
    expect(screen.getByText(/sonraki adımda yapılır/)).toBeVisible();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('does not create sample data or complete onboarding from this form', async () => {
    const user = userEvent.setup();
    renderOnboardingPreferenceForm();

    await screen.findByText(/user@example.com hesabı için/);
    await user.selectOptions(screen.getByLabelText('Başlangıç tercihi'), 'START_EMPTY');
    await user.click(screen.getByRole('button', { name: 'Tercihi ve saat dilimini onayla' }));

    await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalled());
    expect(JSON.stringify(mocks.updateCurrentUser.mock.calls)).not.toContain('START_EMPTY');
    expect(JSON.stringify(mocks.updateCurrentUser.mock.calls)).not.toContain('CREATE_SAMPLE_DATA');
    expect(JSON.stringify(mocks.updateCurrentUser.mock.calls)).not.toContain('COMPLETED');
  });

  it('shows a retryable error when the current User ETag is stale', async () => {
    const user = userEvent.setup();
    mocks.updateCurrentUser.mockResolvedValueOnce({
      error: {
        detail: 'Hesap bilgisi değişmiş. Lütfen sayfayı yenileyip tekrar deneyin.',
      },
    });
    renderOnboardingPreferenceForm();

    await screen.findByText(/user@example.com hesabı için/);
    await user.click(screen.getByRole('button', { name: 'Tercihi ve saat dilimini onayla' }));

    expect(await screen.findByText('Tercihler kaydedilemedi')).toBeVisible();
    expect(screen.getByText(/Hesap bilgisi değişmiş/)).toBeVisible();
  });
});

function renderOnboardingPreferenceForm(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingPreferenceForm />
    </QueryClientProvider>,
  );
}
