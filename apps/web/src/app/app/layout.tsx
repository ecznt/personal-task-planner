import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { AppShell } from '@/features/navigation/app-shell';
import { Celebration } from '@/features/today/celebration';
import { TaskInspectorProvider } from '@/features/tasks/task-inspector-provider';

export const metadata: Metadata = {
  title: {
    default: 'Kişisel İş Planlayıcı',
    template: '%s | Kişisel İş Planlayıcı',
  },
};

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionBoundary>
      <TaskInspectorProvider>
        <AppShell>{children}</AppShell>
      </TaskInspectorProvider>
      <Celebration />
    </SessionBoundary>
  );
}
