import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { TaskDetail } from '@/features/tasks/task-detail';

export const metadata: Metadata = {
  title: 'Görev Detayı | Kişisel İş Planlayıcı',
};

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <TaskDetail taskId={taskId} />
        </SessionBoundary>
      </div>
    </main>
  );
}
