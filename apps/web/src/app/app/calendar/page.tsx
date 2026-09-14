import type { Metadata } from 'next';

import { CalendarView } from '@/features/calendar/calendar-view';

export const metadata: Metadata = {
  title: 'Takvim',
};

export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <CalendarView />
    </div>
  );
}
