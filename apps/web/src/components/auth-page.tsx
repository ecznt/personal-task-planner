import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

import { AmbientBackground } from '@/components/ambient-background';
import { cn } from '@/lib/utils';

export function AuthPage({
  children,
  width = 'md',
}: Readonly<{ children: React.ReactNode; width?: 'md' | 'xl' }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip px-4 py-10 sm:py-16">
      <AmbientBackground />
      <div className={cn('w-full', width === 'md' ? 'max-w-md' : 'max-w-xl')}>
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Ana sayfaya dön">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5E6AD2] to-[#3B46C4] text-primary-foreground shadow-glow">
              <CheckIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold text-gradient">Kişisel İş Planlayıcı</span>
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
