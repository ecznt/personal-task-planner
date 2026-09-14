import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreferencesForm } from './preferences-form';

const mocks = vi.hoisted(() => ({
  fetchCsrf: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  usePushChannel: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getCurrentUser: mocks.getCurrentUser,
  updateCurrentUser: mocks.updateCurrentUser,
}));

vi.mock('@/features/auth/auth-api', () => ({
  apiError: (error: { detail?: string }) => new Error(error.detail ?? 'error'),
  csrfQueryKey: ['csrf'],
  fetchCsrf: mocks.fetchCsrf,
}));

vi.mock('@/features/push/use-push-channel', () => ({
  usePushChannel: mocks.usePushChannel,
}));

function renderPreferencesForm(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PreferencesForm />
    </QueryClientProvider>,
  );
}

const profile = {
  accountLifecycleState: 'ACTIVE',
  email: 'user@example.com',
  id: '018f9f7c-0000-7000-8000-000000000001',
  inAppReminderNotificationsEnabled: true,
  onboardingState: 'COMPLETED',
  pushReminderNotificationsEnabled: true,
  timeZone: 'Europe/Istanbul',
};

function mockCurrentUserResolved(overrides: Partial<typeof profile> = {}) {
  mocks.getCurrentUser.mockResolvedValue({
    data: {
      data: { ...profile, ...overrides },
    },
    response: {
      headers: new Headers({ etag: '"safe-etag"' }),
    },
  });
}

describe('PreferencesForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchCsrf.mockResolvedValue({ expiresAt: '2099-01-01T00:00:00.000Z', token: 'csrf-token' });
    mocks.usePushChannel.mockReturnValue({
      disable: mocks.disablePush,
      enable: mocks.enablePush,
      state: 'idle',
    });
    mockCurrentUserResolved();
  });

  it('renders time zone and notification preferences from the current user', async () => {
    renderPreferencesForm();

    expect(await screen.findByRole('heading', { name: 'Saat dilimi' })).toBeInTheDocument();
    expect(screen.getByLabelText('Saat dilimi')).toHaveValue('Europe/Istanbul');
    expect(screen.getByRole('checkbox', { name: 'Uygulama içi bildirimler' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' })).toBeChecked();
    expect(
      screen.getByRole('heading', { name: 'Bildirimler' }),
    ).toBeInTheDocument();
  });

  it('saves a changed time zone with If-Match after preview confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.updateCurrentUser.mockResolvedValue({
      data: {
        data: { ...profile, timeZone: 'UTC' },
      },
      response: {
        headers: new Headers({ etag: '"fresh-etag"' }),
      },
    });

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.selectOptions(screen.getByLabelText('Saat dilimi'), 'UTC');

    const saveButton = screen.getByRole('button', { name: 'Kaydet' });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(mocks.updateCurrentUser).toHaveBeenCalledWith({
        body: { timeZone: 'UTC' },
        client: {},
        headers: {
          'If-Match': '"safe-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      });
    });
  });

  it('does not save a time zone change when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.selectOptions(screen.getByLabelText('Saat dilimi'), 'UTC');

    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
  });

  it('confirms before disabling notifications and then saves the preference', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.updateCurrentUser.mockResolvedValue({
      data: {
        data: { ...profile, inAppReminderNotificationsEnabled: false },
      },
      response: {
        headers: new Headers({ etag: '"fresh-etag"' }),
      },
    });

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Uygulama içi bildirimler' }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(mocks.updateCurrentUser).toHaveBeenCalledWith({
        body: { inAppReminderNotificationsEnabled: false },
        client: {},
        headers: {
          'If-Match': '"safe-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      });
    });
  });

  it('does not disable notifications when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Uygulama içi bildirimler' }));

    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Uygulama içi bildirimler' })).toBeChecked();
  });

  it('enables web push after permission grant and saves the preference', async () => {
    mockCurrentUserResolved({ pushReminderNotificationsEnabled: false });
    mocks.enablePush.mockResolvedValue('granted');
    mocks.updateCurrentUser.mockResolvedValue({
      data: {
        data: { ...profile, pushReminderNotificationsEnabled: true },
      },
      response: {
        headers: new Headers({ etag: '"fresh-etag"' }),
      },
    });

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' }));

    await waitFor(() => {
      expect(mocks.enablePush).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mocks.updateCurrentUser).toHaveBeenCalledWith({
        body: { pushReminderNotificationsEnabled: true },
        client: {},
        headers: {
          'If-Match': '"safe-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      });
    });
  });

  it('does not save web push preference when permission is denied', async () => {
    mockCurrentUserResolved({ pushReminderNotificationsEnabled: false });
    mocks.enablePush.mockResolvedValue('denied');

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' }));

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' })).not.toBeChecked();
    });
    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
  });

  it('confirms before disabling web push and saves the preference', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.disablePush.mockResolvedValue(undefined);
    mocks.updateCurrentUser.mockResolvedValue({
      data: {
        data: { ...profile, pushReminderNotificationsEnabled: false },
      },
      response: {
        headers: new Headers({ etag: '"fresh-etag"' }),
      },
    });

    renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(mocks.disablePush).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mocks.updateCurrentUser).toHaveBeenCalledWith({
        body: { pushReminderNotificationsEnabled: false },
        client: {},
        headers: {
          'If-Match': '"safe-etag"',
          'X-CSRF-Token': 'csrf-token',
        },
      });
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPreferencesForm();

    await screen.findByRole('heading', { name: 'Saat dilimi' });

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});