import type { KanbanTaskSummary } from '../domain/task.entity';
import type { KanbanTaskDto } from './task.dto';
import { serializeTaskLabels } from './task-label.mapper';

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
    parentTaskId: task.parentTaskId,
    subtaskCount: task.subtaskCount,
    completedSubtaskCount: task.completedSubtaskCount,
    labels: serializeTaskLabels(task.labels),
    project: task.project ?? null,
    parentTask: task.parentTask
      ? {
          id: task.parentTask.id,
          title: task.parentTask.title,
          canonicalStatus: task.parentTask.canonicalStatus,
        }
      : null,
    areaName: task.areaName,
  };
}
