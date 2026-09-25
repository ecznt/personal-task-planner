import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchCsrf: vi.fn(),
  record: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  celebrate: vi.fn(),
}));

vi.mock('@planner/api-client', () => ({
  apiClient: {},
  getFocusStatistics: () => Promise.resolve({ data: { data: undefined }, error: undefined }),
  listFocusSessions: () => Promise.resolve({ data: { data: [] }, error: undefined }),
  recordFocusSession: (...args: unknown[]) => mocks.record(...args),
}));

vi.mock('@/features/auth/auth-api', () => ({
  fetchCsrf: () => mocks.fetchCsrf(),
}));

vi.mock('@/features/today/celebration-store', () => ({
  celebrateTaskCompleted: () => mocks.celebrate(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { setActiveStore, stashPendingRecord } from './focus-active-store';
import { FocusProvider } from './focus-provider';
import { useFocus } from './use-focus';

function Probe() {
  const { startFocus, cancelFocus, openFocus } = useFocus();

  return (
    <div>
      <button type="button" onClick={() => startFocus(5)}>
        start
      </button>
      <button type="button" onClick={() => cancelFocus()}>
        cancel
      </button>
      <button type="button" onClick={() => openFocus()}>
        open
      </button>
    </div>
  );
}

function renderApp() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <FocusProvider>
        <Probe />
      </FocusProvider>
    </QueryClientProvider>,
  );
}

const pillButton = () => screen.queryByRole('button', { name: 'Odak zamanlayıcıyı aç' });

const STARTED_AT = new Date('2026-09-25T09:00:00.000Z');
const ENDED_AT = new Date('2026-09-25T09:05:00.000Z');

describe('FocusProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActiveStore(null);

    mocks.fetchCsrf.mockReset();
    mocks.record.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.celebrate.mockReset();

    mocks.fetchCsrf.mockResolvedValue({ token: 'csrf-token' });
    mocks.record.mockResolvedValue({ data: { data: {} }, error: undefined });
  });

  it('shows the pill while a focus session runs and clears it on cancel without recording', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(pillButton()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'start' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Çiçek · 5 dk')).toBeInTheDocument();
    expect(screen.getAllByText('05:00').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: 'Gizle' }));
    expect(pillButton()).not.toBeNull();
    expect(screen.getAllByText('05:00').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(pillButton()).toBeNull();
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('opens the focus sheet from the trigger', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('records a finished session once, celebrates and hides the pill', async () => {
    renderApp();

    act(() => {
      setActiveStore({
        startedAt: STARTED_AT.toISOString(),
        targetEndAt: ENDED_AT.toISOString(),
        durationMinutes: 5,
        clientKey: 'ck-1',
      });
    });
    await act(async () => {});

    expect(mocks.record).toHaveBeenCalledTimes(1);
    const options = mocks.record.mock.calls[0]?.[0] as {
      body: Record<string, unknown>;
      headers?: Record<string, unknown>;
    };
    expect(options.body).toEqual({
      startedAt: STARTED_AT.toISOString(),
      completedAt: ENDED_AT.toISOString(),
      durationMinutes: 5,
      clientKey: 'ck-1',
    });
    expect(options.headers).toHaveProperty('X-CSRF-Token', 'csrf-token');
    expect(mocks.celebrate).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalled();

    expect(pillButton()).toBeNull();
    expect(window.localStorage.getItem('planner.focus.active')).toBeNull();
  });

  it('stashes a pending record and reports when recording fails', async () => {
    mocks.record.mockRejectedValueOnce(new Error('boom'));
    renderApp();

    act(() => {
      setActiveStore({
        startedAt: STARTED_AT.toISOString(),
        targetEndAt: ENDED_AT.toISOString(),
        durationMinutes: 5,
        clientKey: 'ck-3',
      });
    });
    await act(async () => {});

    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('planner.focus.pending')).not.toBeNull();
  });

  it('retries a stashed pending record on mount', async () => {
    stashPendingRecord({
      startedAt: STARTED_AT.toISOString(),
      completedAt: ENDED_AT.toISOString(),
      durationMinutes: 5,
      clientKey: 'ck-4',
    });

    renderApp();
    await act(async () => {});

    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('planner.focus.pending')).toBeNull();
  });
});