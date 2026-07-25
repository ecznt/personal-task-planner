import { MailCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailVerificationForm } from '@/features/auth/email-verification-form';

export const metadata: Metadata = {
  title: 'E-postanızı doğrulayın | Kişisel İş Planlayıcı',
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck aria-hidden="true" />
          </div>
          <CardTitle role="heading" aria-level={1}>
            E-postanızı kontrol edin
          </CardTitle>
          <CardDescription>E-posta adresinizi ve gelen 8 haneli kodu girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailVerificationForm />
        </CardContent>
      </Card>
    </main>
  );
}
