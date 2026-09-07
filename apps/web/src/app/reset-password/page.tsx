import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPage } from '@/components/auth-page';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Yeni parola belirleyin | Kişisel İş Planlayıcı',
  description: 'Parola sıfırlama bağlantınızla yeni parolanızı belirleyin.',
};

export default function ResetPasswordPage() {
  return (
    <AuthPage>
      <Card interactive={false}>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner-edge ring-1 ring-primary/20">
            <ShieldCheck aria-hidden="true" />
          </div>
          <CardTitle role="heading" aria-level={1}>
            Yeni parola belirleyin
          </CardTitle>
          <CardDescription>
            Bağlantı geçerliyse yeni parolanız kaydedilir ve açık oturumlar kapatılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </AuthPage>
  );
}
