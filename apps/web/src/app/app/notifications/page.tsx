import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { NotificationsView } from '@/features/notifications/notifications-view';

export const metadata: Metadata = {
  title: 'Bildirimler | Kişisel İş Planlayıcı',
};

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <NotificationsView />
        </SessionBoundary>
      </div>
    </main>
  );
}
