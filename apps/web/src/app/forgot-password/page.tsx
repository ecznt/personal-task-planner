import { KeyRound } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPage } from '@/components/auth-page';
import { PasswordResetRequestForm } from '@/features/auth/password-reset-request-form';

export const metadata: Metadata = {
  title: 'Parolamı unuttum | Kişisel İş Planlayıcı',
  description: 'Parolanızı güvenli biçimde sıfırlamak için bağlantı isteyin.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <Card interactive={false}>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner-edge ring-1 ring-primary/20">
            <KeyRound aria-hidden="true" />
          </div>
          <CardTitle role="heading" aria-level={1}>
            Parolanızı sıfırlayın
          </CardTitle>
          <CardDescription>
            E-posta adresinizi girin. Hesap uygunsa sıfırlama bağlantısı gönderilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetRequestForm />
        </CardContent>
      </Card>
    </AuthPage>
  );
}
