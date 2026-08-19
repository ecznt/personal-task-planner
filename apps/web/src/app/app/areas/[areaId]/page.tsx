import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { AreaDetail } from '@/features/areas/area-detail';

export const metadata: Metadata = {
  title: 'Alan Detay | Kişisel İş Planlayıcı',
};

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <AreaDetail areaId={areaId} />
        </SessionBoundary>
      </div>
    </main>
  );
}
