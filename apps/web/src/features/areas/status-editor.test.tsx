import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/features/auth/auth-api', () => ({
  apiError: vi.fn(),
  csrfQueryKey: ['csrf'],
  fetchCsrf: vi.fn().mockResolvedValue({ token: 'csrf-token' }),
}));

import { StatusEditor } from './status-editor';

const BASE_DATA = {
  id: 'area-1',
  name: 'Test Alanı',
  version: 1,
  statuses: [
    { id: 's1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1, isDefault: true, active: true },
    { id: 's2', name: 'İnceleme', canonicalStatus: 'IN_PROGRESS', position: 2, isDefault: false, active: true },
    { id: 's3', name: 'Tamamlandı', canonicalStatus: 'COMPLETED', position: 3, isDefault: false, active: true },
  ] as const,
};

function renderStatusEditor(data = BASE_DATA) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <StatusEditor areaId="area-1" areaData={data} />
    </QueryClientProvider>,
  );
}

describe('StatusEditor', () => {
  it('renders all statuses sorted by position', () => {
    renderStatusEditor();

    expect(screen.getAllByText('Yapılacak').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('İnceleme')).toBeInTheDocument();
    expect(screen.getAllByText('Tamamlandı').length).toBeGreaterThanOrEqual(1);
  });

  it('shows default label for default statuses', () => {
    renderStatusEditor();

    expect(screen.getByText('(varsayılan)')).toBeInTheDocument();
  });

  it('shows retire button for non-default active statuses', () => {
    renderStatusEditor();

    const retireButtons = screen.getAllByText('Emekli Et');
    expect(retireButtons).toHaveLength(2);
  });

  it('does not show retire button for default status', () => {
    renderStatusEditor();

    const retireButtons = screen.getAllByText('Emekli Et');
    expect(retireButtons).toHaveLength(2);

    const defaultRow = screen.getAllByText('Yapılacak')[0]?.closest('div');
    const rowRetireButton = defaultRow?.querySelector('button[data-variant="ghost"]');
    expect(rowRetireButton).toBeNull();
  });

  it('shows create button', () => {
    renderStatusEditor();

    expect(screen.getByText('Yeni Durum Ekle')).toBeInTheDocument();
  });

  it('expands create form on click', () => {
    renderStatusEditor();

    fireEvent.click(screen.getByText('Yeni Durum Ekle'));

    expect(screen.getByPlaceholderText('Durum adı')).toBeInTheDocument();
    expect(screen.getByText('Ekle')).toBeInTheDocument();
  });
});
