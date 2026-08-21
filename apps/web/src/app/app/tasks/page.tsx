import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { GlobalTaskList } from '@/features/tasks/global-task-list';

export const metadata: Metadata = {
  title: 'Görevler | Kişisel İş Planlayıcı',
};

export default function GlobalTasksPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <GlobalTaskList />
        </SessionBoundary>
      </div>
    </main>
  );
}
