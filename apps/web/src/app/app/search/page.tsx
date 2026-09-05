import type { Metadata } from 'next';

import { SearchView } from '@/features/search/search-view';

export const metadata: Metadata = {
  title: 'Arama',
};

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <SearchView />
    </div>
  );
}
