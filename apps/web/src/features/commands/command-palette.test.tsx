import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pathname: '/app/today',
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

import { CommandPalette } from './command-palette';

function openPalette() {
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  return screen.findByRole('combobox', { name: 'Komut arama' });
}

describe('CommandPalette', () => {
  beforeEach(() => {
    mocks.pathname = '/app/today';
    mocks.push.mockClear();
  });

  it('opens on Command/Ctrl+K', async () => {
    render(<CommandPalette />);

    await openPalette();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Komutlar' })).toBeInTheDocument();
  });

  it('filters commands while typing', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    const input = await openPalette();
    await user.type(input, 'kanban');

    expect(screen.getByRole('option', { name: /Kanban/ , selected: true })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Bugün/ })).not.toBeInTheDocument();
  });

  it('runs the selected command on Enter and closes', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    const input = await openPalette();
    await user.type(input, 'kanban{Enter}');

    expect(mocks.push).toHaveBeenCalledWith('/app/kanban');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports arrow navigation before Enter', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    const input = await openPalette();
    await user.type(input, 'projel{ArrowDown}{Enter}');

    expect(mocks.push).toHaveBeenCalledWith('/app/projects');
  });

  it('executes navigation from a mouse click', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openPalette();
    await user.type(await screen.findByRole('combobox', { name: 'Komut arama' }), 'kanban');
    await user.click(screen.getByRole('option', { name: /Kanban/ }));

    expect(mocks.push).toHaveBeenCalledWith('/app/kanban');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    const input = await openPalette();
    await user.type(input, 'zzzz');

    expect(screen.getByText('Sonuç bulunamadı')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openPalette();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the shortcuts reference with ?', async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Klavye kısayolları')).toBeInTheDocument();
    expect(screen.getByText('Yeni görev')).toBeInTheDocument();
    expect(screen.getByText('Arama')).toBeInTheDocument();
  });

  it('toggles the shortcuts reference from the footer button', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openPalette();
    await user.click(screen.getByRole('button', { name: 'Kısayollar' }));

    expect(screen.getByText('Klavye kısayolları')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kısayollar' }));

    expect(screen.queryByText('Klavye kısayolları')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(<CommandPalette />);
    await openPalette();

    expect((await axe(document.body, { rules: { 'aria-hidden-focus': { enabled: false } } })).violations).toHaveLength(0);
  });
});