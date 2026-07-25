import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistrationForm } from '@/features/auth/registration-form';

export const metadata: Metadata = {
  title: 'Hesap oluştur | Kişisel İş Planlayıcı',
  description: 'Kişisel planlama alanınız için güvenli bir hesap oluşturun.',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Hesap oluştur</CardTitle>
          <CardDescription>
            İşlerinizi yalnızca size ait özel bir planlama alanında yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </main>
  );
}
