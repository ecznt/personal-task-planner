import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import HomePage from './page';
import PrivacyPage from './privacy/page';
import TermsPage from './terms/page';

describe('foundation home page', () => {
  it('renders the Turkish public product entry points', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kişisel İş Planlayıcı' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/kişisel işlerinizi yalnızca size ait özel bir alanda/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Hesap oluştur' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: 'Oturum aç' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Bugün’e devam et' })).toHaveAttribute(
      'href',
      '/app/today',
    );
    expect(screen.getByRole('link', { name: 'Gizlilik' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Kullanım koşulları' })).toHaveAttribute(
      'href',
      '/terms',
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<HomePage />);

    const result = await axe(container, {
      rules: {
        'color-contrast': {
          enabled: false,
        },
      },
    });

    expect(result.violations).toEqual([]);
  });
});

describe('public policy pages', () => {
  it('renders the privacy page without account-specific information', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Gizlilik' })).toBeVisible();
    expect(screen.getByText(/Kullanıcılar birbirlerinin verilerini göremez/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ürün girişine dön' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/user@example.com/i)).not.toBeInTheDocument();
  });

  it('renders the terms page with the approved MVP boundaries', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Kullanım koşulları' })).toBeVisible();
    expect(screen.getByText(/Ekip, organizasyon, ortak çalışma, billing/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Gizlilik' })).toHaveAttribute('href', '/privacy');
    expect(screen.queryByText(/Google ile giriş/i)).not.toBeInTheDocument();
  });
});
