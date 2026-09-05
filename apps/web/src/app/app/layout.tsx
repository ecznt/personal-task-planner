import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { AppShell } from '@/features/navigation/app-shell';

export const metadata: Metadata = {
  title: {
    default: 'Kişisel İş Planlayıcı',
    template: '%s | Kişisel İş Planlayıcı',
  },
};

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionBoundary>
      <AppShell>{children}</AppShell>
    </SessionBoundary>
  );
}
