import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getCurrentUser: vi.fn(),
}));

import { apiClient, getCurrentUser } from '@planner/api-client';
import { NotificationsView } from './notifications-view';

const mockedApiClient = vi.mocked(apiClient);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);

function mockCurrentUser(enabled: boolean) {
  mockedGetCurrentUser.mockResolvedValue({
    data: {
      data: {
        accountLifecycleState: 'ACTIVE',
        email: 'user@example.com',
        id: '018f9f7c-0000-7000-8000-000000000001',
        inAppReminderNotificationsEnabled: enabled,
        onboardingState: 'COMPLETED',
        timeZone: 'Europe/Istanbul',
      },
    },
    response: {
      headers: new Headers({ etag: '"safe-etag"' }),
    },
  } as unknown as Awaited<ReturnType<typeof getCurrentUser>>);
}

function renderNotificationsView(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationsView />
    </QueryClientProvider>,
  );
}

describe('NotificationsView', () => {
  it('shows the standard empty state when notifications are enabled', async () => {
    mockCurrentUser(true);
    mockedApiClient.get.mockResolvedValue({
      data: { data: [], page: { hasMore: false } },
      error: undefined,
    });

    renderNotificationsView();

    expect(await screen.findByText('Henüz bildirim yok')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bildirimleri Aç' })).not.toBeInTheDocument();
  });

  it('explains suppression and links to preferences when notifications are disabled', async () => {
    mockCurrentUser(false);
    mockedApiClient.get.mockResolvedValue({
      data: { data: [], page: { hasMore: false } },
      error: undefined,
    });

    renderNotificationsView();

    expect(await screen.findByText('Bildirimler kapalı')).toBeInTheDocument();
    const openLink = screen.getByRole('link', { name: 'Bildirimleri Aç' });
    expect(openLink).toHaveAttribute('href', '/app/settings/preferences');
  });
});