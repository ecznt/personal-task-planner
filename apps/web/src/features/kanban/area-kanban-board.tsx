import { StatusKanbanBoard, buildStatusKanbanQuery } from '@/features/kanban/status-kanban-board';

export function AreaKanbanBoard({ areaId }: { areaId: string }) {
  return <StatusKanbanBoard scope={{ kind: 'area', areaId }} />;
}

export { buildStatusKanbanQuery as buildAreaKanbanQuery };
