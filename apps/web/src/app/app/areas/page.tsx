import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { AreaList } from '@/features/areas/area-list';

export const metadata: Metadata = {
  title: 'Alanlar | Kişisel İş Planlayıcı',
};

export default function AreasPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <AreaList />
        </SessionBoundary>
      </div>
    </main>
  );
}
