import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPage } from '@/components/auth-page';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları | Kişisel İş Planlayıcı',
  description: 'Kişisel İş Planlayıcı MVP kullanım koşulları.',
};

export default function TermsPage() {
  return (
    <AuthPage width="xl">
      <article>
        <Card interactive={false}>
          <CardHeader>
            <CardTitle className="text-3xl" role="heading" aria-level={1}>
              Kullanım koşulları
            </CardTitle>
            <CardDescription>
              MVP kişisel iş takibi ve planlama öğrenme projesi olarak kullanılmalıdır.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 leading-7 text-muted-foreground">
            <section aria-labelledby="terms-personal-use">
              <h2 id="terms-personal-use" className="text-lg font-medium text-foreground">
                Kişisel kullanım
              </h2>
              <p>
                Uygulama kişisel Area, opsiyonel Project ve Task yönetimi için tasarlanır. Ekip,
                organizasyon, ortak çalışma, billing ve native mobile kullanım hakları MVP kapsamına
                dahil değildir.
              </p>
            </section>

            <section aria-labelledby="terms-account">
              <h2 id="terms-account" className="text-lg font-medium text-foreground">
                Hesap sorumluluğu
              </h2>
              <p>
                Kullanıcı kendi email/password hesabını güvenli tutmakla sorumludur. Hesap silme
                başlatıldığında erişim hemen kapatılır; tam primary data purge ayrı lifecycle
                sürecinde tamamlanır.
              </p>
            </section>

            <section aria-labelledby="terms-availability">
              <h2 id="terms-availability" className="text-lg font-medium text-foreground">
                MVP sınırları
              </h2>
              <p>
                Bu proje sektördeki güncel geliştirme yöntemlerini öğrenme amacı taşır. Public
                sayfalar ürün sınırlarını açıklar; hesap veya private kaynak varlığına dair bilgi
                sağlamaz.
              </p>
            </section>

            <nav
              className="flex flex-wrap gap-4 text-sm"
              aria-label="Koşullar sayfası bağlantıları"
            >
              <Link className="font-medium text-foreground underline underline-offset-4" href="/">
                Ürün girişine dön
              </Link>
              <Link
                className="font-medium text-foreground underline underline-offset-4"
                href="/privacy"
              >
                Gizlilik
              </Link>
            </nav>
          </CardContent>
        </Card>
      </article>
    </AuthPage>
  );
}
