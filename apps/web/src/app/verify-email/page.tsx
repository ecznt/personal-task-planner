import { MailCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPage } from '@/components/auth-page';
import { EmailVerificationForm } from '@/features/auth/email-verification-form';

export const metadata: Metadata = {
  title: 'E-postanızı doğrulayın | Kişisel İş Planlayıcı',
};

export default function VerifyEmailPage() {
  return (
    <AuthPage>
      <Card interactive={false}>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner-edge ring-1 ring-primary/20">
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
    </AuthPage>
  );
}
