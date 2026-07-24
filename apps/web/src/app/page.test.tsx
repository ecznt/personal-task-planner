import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('foundation home page', () => {
  it('renders the Turkish foundation shell without a product feature', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kişisel İş Planlayıcı' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ürün özellikleri henüz başlamadı/)).toBeInTheDocument();
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
