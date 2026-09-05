import type { Metadata } from 'next';

import { KanbanBoard } from '@/features/kanban/kanban-board';

export const metadata: Metadata = {
  title: 'Kanban',
};

export default function KanbanPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <KanbanBoard />
    </div>
  );
}
