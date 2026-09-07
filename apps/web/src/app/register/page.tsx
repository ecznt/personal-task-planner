import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPage } from '@/components/auth-page';
import { RegistrationForm } from '@/features/auth/registration-form';

export const metadata: Metadata = {
  title: 'Hesap oluştur | Kişisel İş Planlayıcı',
  description: 'Kişisel planlama alanınız için güvenli bir hesap oluşturun.',
};

export default function RegisterPage() {
  return (
    <AuthPage>
      <Card interactive={false}>
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
    </AuthPage>
  );
}
