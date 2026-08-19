import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { CreateAreaForm } from './create-area-form';

function renderCreateAreaForm(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateAreaForm />
    </QueryClientProvider>,
  );
}

describe('CreateAreaForm', () => {
  it('renders create area button', () => {
    renderCreateAreaForm();

    expect(screen.getByRole('button', { name: 'Yeni Alan' })).toBeInTheDocument();
  });

  it('shows form on button click', async () => {
    const user = userEvent.setup();

    renderCreateAreaForm();

    await user.click(screen.getByRole('button', { name: 'Yeni Alan' }));

    expect(screen.getByText('Yeni Alan Oluştur')).toBeInTheDocument();
    expect(screen.getByLabelText('Alan Adı')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCreateAreaForm();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
