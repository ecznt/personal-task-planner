import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { LifecycleListView } from '@/features/lifecycle/lifecycle-list-view';

export const metadata: Metadata = {
  title: 'Çöp Kutusu | Kişisel İş Planlayıcı',
};

export default function TrashPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <LifecycleListView
            state="TRASHED"
            title="Çöp Kutusu"
            description="30 gün sonra kalıcı olarak silinecek içerik"
          />
        </SessionBoundary>
      </div>
    </main>
  );
}
