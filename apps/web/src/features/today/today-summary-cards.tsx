import { AlertCircle, CalendarCheck, CheckCircle2, ListTodo } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TodayCounts = {
  readonly overdue: number;
  readonly plannedToday: number;
  readonly dueToday: number;
  readonly completedToday: number;
  readonly untimed: number;
};

type TodaySummaryCardsProps = {
  readonly counts: TodayCounts;
};

/**
 * Compact KPI row for the Today view. Reads the counts already returned by the
 * Today endpoint (no extra requests) and derives the totals locally.
 */
export function TodaySummaryCards({ counts }: TodaySummaryCardsProps) {
  const total =
    counts.overdue + counts.plannedToday + counts.dueToday + counts.untimed + counts.completedToday;
  const today = counts.plannedToday + counts.dueToday;

  const cards = [
    { title: 'Toplam', value: total, Icon: ListTodo },
    { title: 'Bugün', value: today, Icon: CalendarCheck },
    { title: 'Gecikmiş', value: counts.overdue, Icon: AlertCircle },
    { title: 'Tamamlanan', value: counts.completedToday, Icon: CheckCircle2 },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
