import { StatusKanbanBoard } from '@/features/kanban/status-kanban-board';

export function ProjectKanbanBoard({ projectId, areaId }: { projectId: string; areaId: string }) {
  return <StatusKanbanBoard scope={{ kind: 'project', projectId, areaId }} />;
}
