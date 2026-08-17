import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingPreferenceForm } from './onboarding-preference-form';

const mocks = vi.hoisted(() => ({
  completeCurrentUserOnboarding: vi.fn(),
  getAuthCsrf: vi.fn(),
  getCurrentUser: vi.fn(),
  push: vi.fn(),
  updateCurrentUser: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  completeCurrentUserOnboarding: mocks.completeCurrentUserOnboarding,
  getAuthCsrf: mocks.getAuthCsrf,
  getCurrentUser: mocks.getCurrentUser,
  updateCurrentUser: mocks.updateCurrentUser,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
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
    mocks.completeCurrentUserOnboarding.mockResolvedValue({
      data: {
        data: {
          choice: 'START_EMPTY',
          completedAt: '2026-08-17T09:00:00.000Z',
          next: '/app/today',
          status: 'COMPLETED',
          user: {
            accountLifecycleState: 'ACTIVE',
            email: 'user@example.com',
            id: '018f9f7c-0000-7000-8000-000000000001',
            inAppReminderNotificationsEnabled: true,
            onboardingState: 'COMPLETED',
            timeZone: 'Europe/Istanbul',
          },
        },
      },
      response: {
        headers: new Headers({
          etag: '"completed-user-etag"',
        }),
      },
    });
  });

  it('creates sample data and hands off to Today when sample data is selected', async () => {
    const user = userEvent.setup();
    const { container } = renderOnboardingPreferenceForm();

    expect(await screen.findByText(/user@example.com hesabı için/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Başlangıç tercihi'), 'CREATE_SAMPLE_DATA');
    await user.selectOptions(screen.getByLabelText('Saat dilimi'), 'Europe/Istanbul');
    await user.click(screen.getByRole('button', { name: 'Örnek veri oluştur ve Today’e geç' }));

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
    await waitFor(() =>
      expect(mocks.completeCurrentUserOnboarding).toHaveBeenCalledWith({
        body: {
          choice: 'CREATE_SAMPLE_DATA',
        },
        client: {},
        headers: {
          'Idempotency-Key': expect.any(String),
          'If-Match': '"updated-user-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith('/app/today');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('completes start-empty onboarding and hands off to Today', async () => {
    const user = userEvent.setup();
    renderOnboardingPreferenceForm();

    await screen.findByText(/user@example.com hesabı için/);
    await user.selectOptions(screen.getByLabelText('Başlangıç tercihi'), 'START_EMPTY');
    await user.click(screen.getByRole('button', { name: 'Boş başla ve Today’e geç' }));

    await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.completeCurrentUserOnboarding).toHaveBeenCalledWith({
        body: {
          choice: 'START_EMPTY',
        },
        client: {},
        headers: {
          'Idempotency-Key': expect.any(String),
          'If-Match': '"updated-user-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith('/app/today');
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
    await user.click(screen.getByRole('button', { name: 'Boş başla ve Today’e geç' }));

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
