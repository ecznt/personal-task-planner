import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import { OnboardingWelcome } from './onboarding-welcome';

describe('OnboardingWelcome', () => {
  it('explains the approved personal planning model in Turkish', () => {
    render(<OnboardingWelcome />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kişisel planlama alanınızı tanıyın' }),
    ).toBeVisible();
    expect(screen.getByText(/Area zorunlu bağlamdır/i)).toBeVisible();
    expect(screen.getByText(/Project opsiyoneldir/i)).toBeVisible();
    expect(screen.getByText(/Task her zaman Area’ya bağlıdır/i)).toBeVisible();
    expect(screen.getByText(/yalnızca size aittir/i)).toBeVisible();
    expect(screen.getByText(/Başka kullanıcıların Area, Project veya Task/i)).toBeVisible();
    expect(screen.getByText(/başlangıç tercihinizi ve saat diliminizi/i)).toBeVisible();
  });

  it('does not introduce out-of-scope product concepts', () => {
    render(<OnboardingWelcome />);

    expect(screen.queryByText(/ekip/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/organizasyon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ortak çalışma/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/billing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google ile giriş/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mobil uygulama/i)).not.toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<OnboardingWelcome />);

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
