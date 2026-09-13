import type { Metadata } from 'next';

import { UpcomingView } from '@/features/upcoming/upcoming-view';

export const metadata: Metadata = {
  title: 'Yaklaşan',
};

export default function UpcomingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <UpcomingView />
    </div>
  );
}