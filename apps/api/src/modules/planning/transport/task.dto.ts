import { ApiProperty } from '@nestjs/swagger';

import { ChecklistItemDataDto } from './checklist.dto';
import { LabelSummaryDto } from './label.dto';

export class TaskDataDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ format: 'uuid', type: String })
  areaId!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String, required: false })
  description!: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  plannedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  dueAt!: string | null;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], type: String })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ format: 'uuid', type: String })
  areaStatusId!: string;

  @ApiProperty({ enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], type: String })
  canonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiProperty({ enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'], type: String })
  lifecycleState!: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

  @ApiProperty({ type: Number })
  version!: number;

  @ApiProperty({ type: () => [LabelSummaryDto] })
  labels!: LabelSummaryDto[];

  @ApiProperty({ type: () => [ChecklistItemDataDto] })
  checklistItems!: ChecklistItemDataDto[];

  @ApiProperty({ format: 'uuid', type: String, required: false })
  projectId!: string | null;

  @ApiProperty({ type: Object, required: false })
  recurrence?: Record<string, unknown> | null;
}

export class TaskSummaryDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], type: String })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], type: String })
  canonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiProperty({ type: String, format: 'date-time', required: false })
  dueAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  plannedAt!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'], type: String })
  lifecycleState!: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
}

export class TaskListMetaDto {
  @ApiProperty({ format: 'uuid', type: String, required: false })
  nextCursor?: string;
}

export class TaskResponseDto {
  @ApiProperty({ type: () => TaskDataDto })
  data!: TaskDataDto;
}

export class TaskListResponseDto {
  @ApiProperty({ type: () => [TaskSummaryDto] })
  data!: TaskSummaryDto[];

  @ApiProperty({ type: () => TaskListMetaDto })
  meta!: TaskListMetaDto;
}

export class CreateTaskRequestDto {
  @ApiProperty({ example: 'Marketten süt al', type: String })
  title!: string;

  @ApiProperty({ type: String, required: false })
  description?: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  plannedAt?: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  dueAt?: string | null;

  @ApiProperty({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    type: String,
    required: false,
    default: 'MEDIUM',
  })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class EditTaskRequestDto {
  @ApiProperty({ example: 'Marketten zeytinyagi al', type: String, required: false })
  title?: string;

  @ApiProperty({ type: String, required: false })
  description?: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  plannedAt?: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  dueAt?: string | null;

  @ApiProperty({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    type: String,
    required: false,
  })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;

  @ApiProperty({ format: 'uuid', type: String, required: false })
  areaStatusId?: string | null;

  @ApiProperty({ type: [String], format: 'uuid', required: false })
  labelIds?: string[];

  @ApiProperty({ format: 'uuid', type: String, required: false })
  projectId?: string | null;
}

export class TodayTaskSummaryDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], type: String })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], type: String })
  canonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiProperty({ type: String, format: 'date-time', required: false })
  dueAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  plannedAt!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'], type: String })
  lifecycleState!: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

  @ApiProperty({ type: [String] })
  reasons!: string[];
}

export class TodaySectionDto {
  @ApiProperty({ type: Number })
  count!: number;

  @ApiProperty({ type: () => [TodayTaskSummaryDto] })
  tasks!: TodayTaskSummaryDto[];
}

export class TodayResponseDto {
  @ApiProperty({ type: String })
  today!: string;

  @ApiProperty({ type: String })
  timezone!: string;

  @ApiProperty({ type: () => TodaySectionDto })
  overdue!: TodaySectionDto;

  @ApiProperty({ type: () => TodaySectionDto })
  plannedToday!: TodaySectionDto;

  @ApiProperty({ type: () => TodaySectionDto })
  dueToday!: TodaySectionDto;

  @ApiProperty({ type: () => TodaySectionDto })
  completedToday!: TodaySectionDto;
}

export class KanbanColumnDto {
  @ApiProperty({ type: Number })
  count!: number;

  @ApiProperty({ type: () => [TaskSummaryDto] })
  tasks!: TaskSummaryDto[];
}

export class KanbanResponseDto {
  @ApiProperty({ type: () => KanbanColumnDto })
  todo!: KanbanColumnDto;

  @ApiProperty({ type: () => KanbanColumnDto })
  inProgress!: KanbanColumnDto;

  @ApiProperty({ type: () => KanbanColumnDto })
  completed!: KanbanColumnDto;
}

export class MoveKanbanTaskRequestDto {
  @ApiProperty({ format: 'uuid', type: String })
  taskId!: string;

  @ApiProperty({ enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], type: String })
  targetCanonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
}

export class AreaKanbanStatusDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], type: String })
  canonicalStatus!: string;

  @ApiProperty({ type: Number })
  position!: number;
}

export class AreaKanbanColumnDto {
  @ApiProperty({ format: 'uuid', type: String })
  statusId!: string;

  @ApiProperty({ type: Number })
  count!: number;

  @ApiProperty({ type: () => [TaskSummaryDto] })
  tasks!: TaskSummaryDto[];
}

export class AreaKanbanResponseDto {
  @ApiProperty({ type: () => [AreaKanbanStatusDto] })
  statuses!: AreaKanbanStatusDto[];

  @ApiProperty({ type: () => [AreaKanbanColumnDto] })
  columns!: AreaKanbanColumnDto[];
}

export class MoveAreaKanbanTaskRequestDto {
  @ApiProperty({ format: 'uuid', type: String })
  taskId!: string;

  @ApiProperty({ format: 'uuid', type: String })
  targetAreaStatusId!: string;
}
