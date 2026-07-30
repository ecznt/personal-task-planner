import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Yeni parola belirleyin | Kişisel İş Planlayıcı',
  description: 'Parola sıfırlama bağlantınızla yeni parolanızı belirleyin.',
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
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
    </main>
  );
}
