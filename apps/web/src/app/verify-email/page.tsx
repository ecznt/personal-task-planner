import { MailCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <CardTitle>E-postanızı kontrol edin</CardTitle>
          <CardDescription>
            Hesabınız varsa veya yeni oluşturulduysa doğrulama adımlarını e-posta ile alacaksınız.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bu ekran e-posta adresinin sistemde bulunup bulunmadığını açıklamaz.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
