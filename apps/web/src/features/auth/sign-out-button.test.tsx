import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignOutButton } from './sign-out-button';

const mocks = vi.hoisted(() => ({
  deleteAuthSession: vi.fn(),
  getAuthCsrf: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  deleteAuthSession: mocks.deleteAuthSession,
  getAuthCsrf: mocks.getAuthCsrf,
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthCsrf.mockResolvedValue({
      data: { data: { expiresAt: '2099-01-01T00:00:00.000Z', token: 'csrf-token' } },
    });
    mocks.deleteAuthSession.mockResolvedValue({});
  });

  it('ends the current session with CSRF before replacing the document', async () => {
    const user = userEvent.setup();
    const { container } = renderSignOutButton();

    await user.click(screen.getByRole('button', { name: 'Oturumu kapat' }));

    await waitFor(() =>
      expect(mocks.deleteAuthSession).toHaveBeenCalledWith({
        client: {},
        headers: { 'X-CSRF-Token': 'csrf-token' },
      }),
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/login?signedOut=1');
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it('keeps the user in place and offers retry feedback when revocation fails', async () => {
    const user = userEvent.setup();
    mocks.deleteAuthSession.mockResolvedValueOnce({
      error: {
        detail: 'İşlem tamamlanamadı.',
      },
    });
    renderSignOutButton();

    await user.click(screen.getByRole('button', { name: 'Oturumu kapat' }));

    expect(await screen.findByText('Oturum kapatılamadı')).toBeVisible();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

function renderSignOutButton(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SignOutButton navigate={mocks.navigate} />
    </QueryClientProvider>,
  );
}
