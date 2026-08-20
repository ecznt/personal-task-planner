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
}
