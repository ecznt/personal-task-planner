import { KeyRound } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordResetRequestForm } from '@/features/auth/password-reset-request-form';

export const metadata: Metadata = {
  title: 'Parolamı unuttum | Kişisel İş Planlayıcı',
  description: 'Parolanızı güvenli biçimde sıfırlamak için bağlantı isteyin.',
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
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
    </main>
  );
}
