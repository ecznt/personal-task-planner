import type { Metadata } from 'next';

import { NotificationsView } from '@/features/notifications/notifications-view';

export const metadata: Metadata = {
  title: 'Bildirimler',
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <NotificationsView />
    </div>
  );
}
