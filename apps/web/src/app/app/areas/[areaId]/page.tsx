import type { Metadata } from 'next';

import { AreaDetail } from '@/features/areas/area-detail';

export const metadata: Metadata = {
  title: 'Alan Detay',
};

export default async function AreaDetailPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <AreaDetail areaId={areaId} />
    </div>
  );
}
