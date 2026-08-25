import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { foundationMessages } from '@/i18n/messages/tr';

export const metadata: Metadata = {
  title: 'Kişisel İş Planlayıcı',
  description: 'Kişisel işleriniz için özel, Türkçe ve responsive planlama alanı.',
};

export default function HomePage() {
  return (
    <main className="block min-h-screen bg-muted/40 px-4 py-8 sm:py-12">
      <section
        className="mx-auto flex w-full max-w-5xl flex-col gap-8"
        aria-labelledby="foundation-title"
      >
        <div className="grid gap-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-muted-foreground">
              {foundationMessages.eyebrow}
            </p>
            <div className="grid gap-4">
              <h1
                id="foundation-title"
                className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl"
              >
                {foundationMessages.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {foundationMessages.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors duration-150 active:scale-[0.97] hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                href="/register"
              >
                Hesap oluştur
              </Link>
              <Link
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors duration-150 active:scale-[0.97] hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                href="/login"
              >
                Oturum aç
              </Link>
              <Link
                className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors duration-150 active:scale-[0.97] hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                href="/app/today"
              >
                Bugün’e devam et
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                MVP odağı
              </CardTitle>
              <CardDescription>İlk sürüm kişisel ve owner-scoped kalır.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm text-muted-foreground">
                <li>Her Task tam olarak bir Area altında bulunur.</li>
                <li>Project kullanımı isteğe bağlıdır.</li>
                <li>Başka kullanıcıların verileri görünmez.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Area
              </CardTitle>
              <CardDescription>İşlerinizin ana sorumluluk alanı.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Kişisel bağlamlarınızı ayırır ve her Task için zorunlu çalışma alanını belirler.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Project
              </CardTitle>
              <CardDescription>Area içinde opsiyonel odak grubu.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Bir Task doğrudan Area altında veya aynı Area içindeki bir Project altında olabilir.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Task
              </CardTitle>
              <CardDescription>Günlük planlama ve takip birimi.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Açıklama, tarih, öncelik, label ve checklist gibi temel kişisel takip alanlarını
              taşır.
            </CardContent>
          </Card>
        </div>

        <nav
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          aria-label="Yasal ve destekleyici bağlantılar"
        >
          <Link className="underline underline-offset-4" href="/privacy">
            Gizlilik
          </Link>
          <Link className="underline underline-offset-4" href="/terms">
            Kullanım koşulları
          </Link>
        </nav>
      </section>
    </main>
  );
}
