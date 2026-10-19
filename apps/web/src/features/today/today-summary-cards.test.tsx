import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TodaySummaryCards } from './today-summary-cards';

function cardFor(title: string): HTMLElement {
  const el = screen.getByText(title).closest('[data-slot="card"]');
  if (el === null) {
    throw new Error(`No card found for title "${title}"`);
  }
  return el as HTMLElement;
}

describe('TodaySummaryCards', () => {
  it('renders the four KPI card titles', () => {
    render(
      <TodaySummaryCards
        counts={{ overdue: 0, plannedToday: 0, dueToday: 0, completedToday: 0, untimed: 0 }}
      />,
    );

    expect(screen.getByText('Toplam')).toBeInTheDocument();
    expect(screen.getByText('Bugün')).toBeInTheDocument();
    expect(screen.getByText('Gecikmiş')).toBeInTheDocument();
    expect(screen.getByText('Tamamlanan')).toBeInTheDocument();
  });

  it('derives the total from every section count', () => {
    render(
      <TodaySummaryCards
        counts={{ overdue: 2, plannedToday: 1, dueToday: 3, completedToday: 4, untimed: 2 }}
      />,
    );

    expect(cardFor('Toplam')).toHaveTextContent('12');
  });

  it('derives today as planned plus due', () => {
    render(
      <TodaySummaryCards
        counts={{ overdue: 2, plannedToday: 1, dueToday: 3, completedToday: 4, untimed: 2 }}
      />,
    );

    expect(cardFor('Bugün')).toHaveTextContent('4');
  });

  it('reports overdue and completed counts directly', () => {
    render(
      <TodaySummaryCards
        counts={{ overdue: 7, plannedToday: 0, dueToday: 0, completedToday: 5, untimed: 0 }}
      />,
    );

    expect(cardFor('Gecikmiş')).toHaveTextContent('7');
    expect(cardFor('Tamamlanan')).toHaveTextContent('5');
  });

  it('renders zero for every card when there are no tasks', () => {
    render(
      <TodaySummaryCards
        counts={{ overdue: 0, plannedToday: 0, dueToday: 0, completedToday: 0, untimed: 0 }}
      />,
    );

    expect(cardFor('Toplam')).toHaveTextContent('0');
    expect(cardFor('Bugün')).toHaveTextContent('0');
    expect(cardFor('Gecikmiş')).toHaveTextContent('0');
    expect(cardFor('Tamamlanan')).toHaveTextContent('0');
  });
});
