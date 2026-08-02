import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Hesap Silme Başlatıldı | Kişisel İş Planlayıcı',
};

export default function AccountDeletionStartedPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Hesap silme başlatıldı
          </CardTitle>
          <CardDescription>
            Bu cihazdaki oturumunuz kapatıldı. Hesap silme süreci primary data purge adımıyla devam
            eder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>
            Güvenlik nedeniyle bu hesaba yeniden erişemezsiniz. Bu sayfa başka kullanıcı veya kaynak
            bilgisi göstermez.
          </p>
          <Link className="font-medium underline underline-offset-4" href="/">
            Ürün girişine dön
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
