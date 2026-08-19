import type { Metadata } from 'next';

import { SessionBoundary } from '@/features/auth/session-boundary';
import { CreateTaskForm } from '@/features/tasks/create-task-form';

export const metadata: Metadata = {
  title: 'Yeni Görev | Kişisel İş Planlayıcı',
};

export default async function NewTaskPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <SessionBoundary>
          <div className="mb-4">
            <a
              href={`/app/areas/${areaId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Alana dön
            </a>
          </div>
          <CreateTaskForm areaId={areaId} />
        </SessionBoundary>
      </div>
    </main>
  );
}
