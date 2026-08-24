import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { TodayView } from '@/features/today/today-view';

export const metadata: Metadata = {
  title: 'Bugün | Kişisel İş Planlayıcı',
};

export default function TodayPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <TodayView />
        </SessionBoundary>
      </div>
    </main>
  );
}
