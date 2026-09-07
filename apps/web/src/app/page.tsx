import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckIcon, FolderTreeIcon, LayoutGridIcon, ListTodoIcon, LockIcon } from 'lucide-react';

import { AmbientBackground } from '@/components/ambient-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spotlight } from '@/components/spotlight';
import { foundationMessages } from '@/i18n/messages/tr';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Kişisel İş Planlayıcı',
  description: 'Kişisel işleriniz için özel, Türkçe ve responsive planlama alanı.',
};

function AppPreview() {
  const navItems = ['Bugün', 'Görevler', 'Kanban', 'Alanlar'];
  const tasks = [
    { width: 'w-36', done: true },
    { width: 'w-48', done: false },
    { width: 'w-28', done: false },
  ];

  return (
    <Spotlight aria-hidden="true" className="relative hidden lg:block">
      <div className="relative rounded-2xl border border-border/70 bg-background/80 p-3 shadow-surface-hover backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="w-36 shrink-0 space-y-1.5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="size-4 rounded-md bg-gradient-to-br from-[#5E6AD2] to-[#3B46C4] shadow-glow" />
              <span className="h-2 w-14 rounded-full bg-foreground/15" />
            </div>
            {navItems.map((item, index) => (
              <div
                key={item}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5',
                  index === 0 && 'bg-primary/10 ring-1 ring-primary/20',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    index === 0 ? 'bg-primary' : 'bg-foreground/20',
                  )}
                />
                <span className="h-2 w-14 rounded-full bg-foreground/15" />
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="h-3 w-14 rounded-full bg-foreground/25" />
              <span className="h-2 w-20 rounded-full bg-foreground/10" />
            </div>
            {tasks.map((task, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border border-border/70 bg-card p-2.5',
                  index === 0 && 'ring-1 ring-primary/20',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-md',
                    task.done
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'border border-input bg-transparent',
                  )}
                >
                  {task.done ? <CheckIcon className="size-3" aria-hidden="true" /> : null}
                </span>
                <span className={cn('h-2 rounded-full bg-foreground/15', task.width)} />
                <span
                  className={cn(
                    'ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                    task.done
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {task.done ? 'Tamamlandı' : 'Öncelik'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
    </Spotlight>
  );
}

function BentoCard({
  icon: Icon,
  title,
  description,
  className,
  children,
}: Readonly<{
  icon: typeof LayoutGridIcon;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <Spotlight className={className}>
      <Card variant="glass" className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-inner-edge ring-1 ring-primary/20">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <CardTitle role="heading" aria-level={3} className="text-base">
              {title}
            </CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">{children}</CardContent>
      </Card>
    </Spotlight>
  );
}

const TASK_DETAILS = ['Açıklama', 'Tarih', 'Öncelik', 'Etiket', 'Checklist'] as const;

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-transparent">
      <AmbientBackground />

      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:py-24"
        aria-label="Tanıtım"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary shadow-inner-edge">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {foundationMessages.eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gradient sm:text-5xl lg:text-6xl">
              {foundationMessages.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {foundationMessages.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Hesap oluştur</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Oturum aç</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/app/today">Bugün&rsquo;e devam et</Link>
              </Button>
            </div>
          </div>

          <AppPreview />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-gradient sm:text-2xl">
              Üç katmandan oluşan yapı
            </h2>
            <p className="text-sm text-muted-foreground">
              Alan, opsiyonel proje ve görev; hepsi tek kişilik, size özel bir alanda.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <BentoCard
              icon={LayoutGridIcon}
              title="Area"
              description="İşlerinizin ana sorumluluk alanı."
              className="lg:col-span-4"
            >
              <p>
                Kişisel bağlamlarınızı ayırır ve her Task için zorunlu çalışma alanını belirler.
              </p>
            </BentoCard>
            <BentoCard
              icon={FolderTreeIcon}
              title="Project"
              description="Area içinde opsiyonel odak grubu."
              className="lg:col-span-2"
            >
              <p>
                Bir Task doğrudan Area altında veya aynı Area içindeki bir Project altında olabilir.
              </p>
            </BentoCard>
            <BentoCard
              icon={ListTodoIcon}
              title="Task"
              description="Günlük planlama ve takip birimi."
              className="lg:col-span-3"
            >
              <div className="flex flex-wrap gap-1.5">
                {TASK_DETAILS.map((detail) => (
                  <span
                    key={detail}
                    className="inline-flex items-center rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </BentoCard>
            <BentoCard
              icon={LockIcon}
              title="Yalnızca size ait"
              description="Başka kullanıcıların verileri görünmez."
              className="lg:col-span-3"
            >
              <p>
                Her hesap kendi veri alanında izole çalışır; paylaşım ve ortak kullanım MVP
                kapsamına dahil değildir.
              </p>
            </BentoCard>
          </div>
        </div>
      </section>

      <footer
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-10 text-sm text-muted-foreground"
        aria-label="Yasal ve destekleyici bağlantılar"
      >
        <span className="border-border/60 border-r pr-5 text-xs text-muted-foreground/80">
          Kişisel kullanım
        </span>
        <Link className="underline underline-offset-4" href="/privacy">
          Gizlilik
        </Link>
        <Link className="underline underline-offset-4" href="/terms">
          Kullanım koşulları
        </Link>
      </footer>
    </main>
  );
}
