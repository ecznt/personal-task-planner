import type { Metadata } from 'next';

import { AreaList } from '@/features/areas/area-list';

export const metadata: Metadata = {
  title: 'Alanlar',
};

export default function AreasPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <AreaList />
    </div>
  );
}
