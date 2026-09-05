import type { Metadata } from 'next';

import { CreateTaskForm } from '@/features/tasks/create-task-form';

export const metadata: Metadata = {
  title: 'Yeni Görev',
};

export default async function NewTaskPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <a href={`/app/areas/${areaId}`} className="text-sm text-muted-foreground hover:underline">
          ← Alana dön
        </a>
      </div>
      <CreateTaskForm areaId={areaId} />
    </div>
  );
}
