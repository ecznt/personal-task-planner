import type { Metadata } from 'next';

import { TemplateList } from '@/features/templates/template-list';

export const metadata: Metadata = {
  title: 'Şablonlar',
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <TemplateList />
    </div>
  );
}