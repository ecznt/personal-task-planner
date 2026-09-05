import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pathname: '/app/today',
  apiGet: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

import { AppShell } from './app-shell';

function renderShell() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AppShell>
        <p>Page content</p>
      </AppShell>
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    mocks.apiGet.mockImplementation(() =>
      Promise.resolve({ data: { data: [] }, error: undefined }),
    );
    mocks.pathname = '/app/today';
  });

  it('renders primary and more destinations with accessible labels', async () => {
    renderShell();

    expect(screen.getByRole('navigation', { name: 'Ana menü (masaüstü)' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Ana menü (mobil)' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Bugün' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Görevler' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Kanban' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Alanlar' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Arşiv' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Çöp Kutusu' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Ayarlar' }).length).toBeGreaterThan(0);
  });

  it('marks the active destination with aria-current', async () => {
    renderShell();

    const todayLinks = screen.getAllByRole('link', { name: 'Bugün' });
    expect(todayLinks.length).toBeGreaterThan(0);
    for (const link of todayLinks) {
      expect(link).toHaveAttribute('aria-current', 'page');
    }
    const tasksLinks = screen.getAllByRole('link', { name: 'Görevler' });
    for (const link of tasksLinks) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('opens the More sheet and lists secondary destinations', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Daha fazla menüyü aç' }));

    expect(await screen.findByRole('navigation', { name: 'Daha fazla menü' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projeler' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ayarlar' })).toBeInTheDocument();
  });

  it('renders the notification and search link with accessible names', async () => {
    renderShell();

    expect(screen.getByRole('link', { name: /Bildirimler/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ara' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderShell();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
