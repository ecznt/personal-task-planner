import type { Metadata } from 'next';

import { GlobalTaskList } from '@/features/tasks/global-task-list';

export const metadata: Metadata = {
  title: 'Görevler',
};

export default function GlobalTasksPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <GlobalTaskList />
    </div>
  );
}
