import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@planner/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { data: [] }, error: undefined }),
    post: vi.fn(),
  },
}));

import { useNewTaskShortcut } from '@/features/shortcuts/new-task-shortcut';

import { QuickCreateDialog } from './quick-create-dialog';

function Harness() {
  useNewTaskShortcut();
  return (
    <div>
      <input data-testid="editable" />
      <QuickCreateDialog />
    </div>
  );
}

function renderHarness() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe('New Task shortcut', () => {
  it('opens the quick create dialog when N is pressed outside an editable target', async () => {
    renderHarness();

    fireEvent.keyDown(document, { key: 'n' });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('does not open the dialog while typing in an input', () => {
    renderHarness();

    fireEvent.keyDown(screen.getByTestId('editable'), { key: 'n' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});