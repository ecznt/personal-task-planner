import type { Metadata } from 'next';

import { LifecycleListView } from '@/features/lifecycle/lifecycle-list-view';

export const metadata: Metadata = {
  title: 'Arşiv',
};

export default function ArchivePage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <LifecycleListView
        state="ARCHIVED"
        title="Arşiv"
        description="Arşivlenen alanlar, projeler ve görevler"
      />
    </div>
  );
}
