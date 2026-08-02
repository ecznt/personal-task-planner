import type { Metadata } from 'next';

import { AccountDeletionForm } from '@/features/auth/account-deletion-form';

export const metadata: Metadata = {
  title: 'Hesap Ayarları | Kişisel İş Planlayıcı',
};

export default function AccountSettingsPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Ayarlar</p>
          <h1 className="text-3xl font-semibold tracking-tight">Hesap</h1>
          <p className="text-muted-foreground">
            Hesap erişimi ve gizlilikle ilgili hassas işlemleri buradan yönetebilirsiniz.
          </p>
        </header>
        <AccountDeletionForm />
      </div>
    </main>
  );
}
