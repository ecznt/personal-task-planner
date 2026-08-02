import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Gizlilik | Kişisel İş Planlayıcı',
  description: 'Kişisel İş Planlayıcı için MVP gizlilik beklentileri.',
};

export default function PrivacyPage() {
  return (
    <main className="block min-h-screen bg-muted/40 px-4 py-8 sm:py-12">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl" role="heading" aria-level={1}>
              Gizlilik
            </CardTitle>
            <CardDescription>
              Bu uygulama kişisel kullanım için tasarlanır ve MVP’de ortak çalışma içermez.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 leading-7 text-muted-foreground">
            <section aria-labelledby="privacy-private-space">
              <h2 id="privacy-private-space" className="text-lg font-medium text-foreground">
                Özel planlama alanı
              </h2>
              <p>
                Area, Project, Task, label, checklist ve bildirim verileri yalnızca ilgili kullanıcı
                hesabının kişisel çalışma alanına aittir. Kullanıcılar birbirlerinin verilerini
                göremez.
              </p>
            </section>

            <section aria-labelledby="privacy-auth">
              <h2 id="privacy-auth" className="text-lg font-medium text-foreground">
                Hesap ve oturum
              </h2>
              <p>
                MVP email/password authentication kullanır. Oturumlar güvenli cookie ile yönetilir;
                parola veya gizli token değerleri kullanıcı arayüzünde, loglarda veya public
                sayfalarda gösterilmez.
              </p>
            </section>

            <section aria-labelledby="privacy-boundary">
              <h2 id="privacy-boundary" className="text-lg font-medium text-foreground">
                Kapsam dışı veri kullanımı
              </h2>
              <p>
                İlk sürümde collaboration, organization, billing, native mobile app, sosyal giriş ve
                üçüncü taraf productivity entegrasyonları yoktur. Public sayfalar hesap veya kaynak
                varlığı hakkında bilgi vermez.
              </p>
            </section>

            <nav
              className="flex flex-wrap gap-4 text-sm"
              aria-label="Gizlilik sayfası bağlantıları"
            >
              <Link className="font-medium text-foreground underline underline-offset-4" href="/">
                Ürün girişine dön
              </Link>
              <Link
                className="font-medium text-foreground underline underline-offset-4"
                href="/terms"
              >
                Kullanım koşulları
              </Link>
            </nav>
          </CardContent>
        </Card>
      </article>
    </main>
  );
}
