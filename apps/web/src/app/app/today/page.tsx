import type { Metadata } from 'next';

import { TodayView } from '@/features/today/today-view';

export const metadata: Metadata = {
  title: 'Bugün',
};

export default function TodayPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <TodayView />
    </div>
  );
}
