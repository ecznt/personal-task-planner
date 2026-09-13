import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/settings/preferences',
}));

import { SettingsTabs } from './settings-tabs';

describe('SettingsTabs', () => {
  it('marks the current settings page as active', () => {
    render(<SettingsTabs />);

    expect(screen.getByRole('link', { name: 'Tercihler' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Tercihler' })).toHaveAttribute(
      'href',
      '/app/settings/preferences',
    );
    expect(screen.getByRole('link', { name: 'Hesap' })).toHaveAttribute(
      'href',
      '/app/settings/account',
    );
    expect(screen.getByRole('link', { name: 'Hesap' })).not.toHaveAttribute('aria-current');
  });
});