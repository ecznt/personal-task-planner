import type { KanbanTaskSummary } from '../domain/task.entity';
import type { KanbanTaskDto } from './task.dto';

export function mapKanbanTaskSummary(task: KanbanTaskSummary): KanbanTaskDto {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    canonicalStatus: task.canonicalStatus,
    dueAt: task.dueAt?.toISOString() ?? null,
    plannedAt: task.plannedAt?.toISOString() ?? null,
    lifecycleState: task.lifecycleState,
    version: task.version,
    areaId: task.areaId,
    labels: task.labels.map((label) => ({ id: label.id, name: label.name })),
    project: task.project ?? null,
    areaName: task.areaName,
  };
}