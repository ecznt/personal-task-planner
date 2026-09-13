import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { PreferencesForm } from '@/features/settings/preferences-form';
import { SettingsTabs } from '@/features/settings/settings-tabs';

export const metadata: Metadata = {
  title: 'Tercihler',
};

export default function PreferencesPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Ayarlar"
        title="Tercihler"
        description="Saat dilimi ve uygulama içi bildirim tercihlerinizi buradan yönetebilirsiniz."
      />
      <SettingsTabs />
      <PreferencesForm />
    </div>
  );
}