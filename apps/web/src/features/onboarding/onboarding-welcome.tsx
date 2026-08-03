import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const modelItems = [
  {
    description: 'Her Task tam olarak bir Area içinde yaşar. Area, sorumluluk bağlamını net tutar.',
    title: 'Area zorunlu bağlamdır',
  },
  {
    description:
      'Project kullanmak isteğe bağlıdır. Bir Project varsa mutlaka bir Area altında bulunur.',
    title: 'Project opsiyoneldir',
  },
  {
    description:
      'Task doğrudan Area altında kalabilir veya aynı Area içindeki bir Project’e bağlanabilir.',
    title: 'Task her zaman Area’ya bağlıdır',
  },
];

export function OnboardingWelcome() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">İlk kurulum</p>
          <CardTitle className="text-3xl tracking-tight sm:text-4xl" role="heading" aria-level={1}>
            Kişisel planlama alanınızı tanıyın
          </CardTitle>
          <CardDescription>
            Bu alan yalnızca size aittir. İşlerinizi önce Area ile bağlama oturtur, gerekirse
            Project ile gruplar, Task ile takip edersiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ol className="grid gap-4 sm:grid-cols-3" aria-label="Planlama modeli">
            {modelItems.map((item, index) => (
              <li
                className="rounded-lg border bg-background p-4 focus-within:ring-2 focus-within:ring-ring"
                key={item.title}
              >
                <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>

          <section className="rounded-lg bg-muted p-4" aria-labelledby="private-space-title">
            <h2 className="text-base font-semibold" id="private-space-title">
              Özel ve kişisel kullanım için
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              İlk sürüm kişisel iş takibi içindir. Başka kullanıcıların Area, Project veya Task
              kayıtları size gösterilmez; sizin kayıtlarınız da başka kullanıcılara gösterilmez.
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              href="/app/today"
            >
              Bugün’e geç
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              href="/app/today"
            >
              Şimdilik boş başla
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
