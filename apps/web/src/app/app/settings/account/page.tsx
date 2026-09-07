import type { Metadata } from 'next';

import { AccountDeletionForm } from '@/features/auth/account-deletion-form';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Hesap',
};

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Ayarlar"
        title="Hesap"
        description="Hesap erişimi ve gizlilikle ilgili hassas işlemleri buradan yönetebilirsiniz."
      />
      <AccountDeletionForm />
    </div>
  );
}
