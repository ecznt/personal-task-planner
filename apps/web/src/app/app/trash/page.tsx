import type { Metadata } from 'next';

import { LifecycleListView } from '@/features/lifecycle/lifecycle-list-view';

export const metadata: Metadata = {
  title: 'Çöp Kutusu',
};

export default function TrashPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <LifecycleListView
        state="TRASHED"
        title="Çöp Kutusu"
        description="30 gün sonra kalıcı olarak silinecek içerik"
      />
    </div>
  );
}
