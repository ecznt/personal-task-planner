import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/auth-api', () => ({
  csrfQueryKey: ['auth', 'csrf'],
  fetchCsrf: vi.fn().mockResolvedValue({ token: 'csrf-token', expiresAt: '2099-01-01' }),
  apiError: (value: unknown) => new Error(String(value)),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from '@planner/api-client';
import { LabelManager } from './label-manager';

const mockedApiClient = vi.mocked(apiClient);

const LABELS = [
  { id: 'label-1', name: 'Acil', color: '#dc2626', version: 3 },
  { id: 'label-2', name: 'İş', color: null, version: 1 },
];

function renderManager(onToggleLabel = vi.fn(), selectedLabelIds: string[] = []) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <LabelManager selectedLabelIds={selectedLabelIds} onToggleLabel={onToggleLabel} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockedApiClient.get.mockReset();
  mockedApiClient.post.mockReset();
  mockedApiClient.patch.mockReset();
  mockedApiClient.get.mockResolvedValue({ data: { data: LABELS }, error: undefined });
});

describe('LabelManager', () => {
  it('renders label chips and toggles selection', async () => {
    const onToggleLabel = vi.fn();
    renderManager(onToggleLabel);

    const chip = await screen.findByRole('button', { name: 'Acil' });
    fireEvent.click(chip);

    expect(onToggleLabel).toHaveBeenCalledWith('label-1');
  });

  it('updates a label color via PATCH with the current version', async () => {
    mockedApiClient.patch.mockResolvedValue({ data: undefined, error: undefined });
    renderManager();

    const colorInput = await screen.findByLabelText('Acil rengini değiştir');
    fireEvent.change(colorInput, { target: { value: '#16a34a' } });

    await waitFor(() => {
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/labels/{labelId}',
          path: { labelId: 'label-1' },
          body: { name: 'Acil', color: '#16a34a' },
          headers: expect.objectContaining({ 'If-Match': '3' }),
        }),
      );
    });
  });

  it('creates a label with the selected palette color', async () => {
    mockedApiClient.post.mockResolvedValue({ data: { data: LABELS[0] }, error: undefined });
    renderManager();

    fireEvent.click(await screen.findByRole('button', { name: '+ Yeni Etiket' }));
    fireEvent.change(screen.getByPlaceholderText('Etiket adı'), {
      target: { value: 'Yeni' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Renk #16a34a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/labels',
          body: { name: 'Yeni', color: '#16a34a' },
        }),
      );
    });
  });
});
