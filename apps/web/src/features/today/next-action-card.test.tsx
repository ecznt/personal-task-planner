import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NextActionCard, type NextActionTask } from '@/features/today/next-action-card';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

const TASKS = [
  {
    id: 'task-overdue',
    title: 'Faturayı öde',
    priority: 'HIGH',
    version: 3,
    reasons: ['overdue'],
    plannedAt: null,
    dueAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'task-due',
    title: 'Bugün biten',
    priority: 'MEDIUM',
    version: 2,
    reasons: ['dueToday'],
    plannedAt: '2026-08-21T09:00:00.000Z',
    dueAt: '2026-08-21T18:00:00.000Z',
  },
  {
    id: 'task-planned',
    title: 'Planlanan görev',
    priority: 'LOW',
    version: 1,
    reasons: ['plannedToday'],
    plannedAt: '2026-08-21T14:00:00.000Z',
    dueAt: null,
  },
] satisfies readonly NextActionTask[];

function renderCard(
  remaining: readonly (typeof TASKS)[number][] = TASKS,
  onComplete = vi.fn(),
) {
  return render(
    <TaskInspectorProvider>
      <NextActionCard remaining={remaining} onComplete={onComplete} />
    </TaskInspectorProvider>,
  );
}

describe('NextActionCard', () => {
  it('picks the overdue task as the single next action', () => {
    renderCard();

    expect(screen.getByRole('region', { name: 'Şimdi ne yapmalıyım?' })).toBeInTheDocument();
    expect(screen.getByText('Faturayı öde')).toBeInTheDocument();
    expect(screen.getByText('Tamamla')).toBeInTheDocument();
    expect(screen.queryByText('Bugün biten')).not.toBeInTheDocument();
  });

  it('falls back to due first and then planned when nothing is overdue', () => {
    renderCard(TASKS.slice(1));

    expect(screen.getByText('Bugün biten')).toBeInTheDocument();
    expect(screen.queryByText('Planlanan görev')).not.toBeInTheDocument();
  });

  it('renders nothing with an empty remaining list', () => {
    const { container } = renderCard([]);

    expect(container.firstChild).toBeNull();
  });

  it('fires onComplete with the task', () => {
    const onComplete = vi.fn();
    renderCard(TASKS, onComplete);

    screen.getByText('Tamamla').click();

    expect(onComplete).toHaveBeenCalledWith(TASKS[0]);
  });
});