import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { KanbanBoard } from '@/features/kanban/kanban-board';

export const metadata: Metadata = {
  title: 'Kanban | Kişisel İş Planlayıcı',
};

export default function KanbanPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <SessionBoundary>
          <KanbanBoard />
        </SessionBoundary>
      </div>
    </main>
  );
}
