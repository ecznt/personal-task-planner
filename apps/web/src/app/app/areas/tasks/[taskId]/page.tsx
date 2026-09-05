import type { Metadata } from 'next';

import { TaskDetail } from '@/features/tasks/task-detail';

export const metadata: Metadata = {
  title: 'Görev Detayı',
};

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <TaskDetail taskId={taskId} />
    </div>
  );
}
