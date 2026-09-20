import { ApiProperty } from '@nestjs/swagger';

export class TaskTemplateDataDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String, required: false })
  description!: string | null;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], type: String })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ type: [String] })
  checklistSteps!: string[];

  @ApiProperty({ type: [String] })
  labelNames!: string[];

  @ApiProperty({ type: Number, required: false })
  defaultPlannedAtOffsetDays!: number | null;

  @ApiProperty({ type: Number })
  version!: number;

  @ApiProperty({ type: String })
  createdAt!: string;

  @ApiProperty({ type: String })
  updatedAt!: string;
}

export class TaskTemplateSummaryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String, required: false })
  description!: string | null;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], type: String })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ type: [String] })
  checklistSteps!: string[];

  @ApiProperty({ type: [String] })
  labelNames!: string[];

  @ApiProperty({ type: Number, required: false })
  defaultPlannedAtOffsetDays!: number | null;

  @ApiProperty({ type: Number })
  version!: number;

  @ApiProperty({ type: String })
  updatedAt!: string;
}

export class TaskTemplateListMetaDto {
  @ApiProperty({ type: String, format: 'uuid', required: false })
  nextCursor?: string;
}

export class TaskTemplateResponseDto {
  @ApiProperty({ type: () => TaskTemplateDataDto })
  data!: TaskTemplateDataDto;
}

export class TaskTemplateListResponseDto {
  @ApiProperty({ type: () => [TaskTemplateSummaryDto] })
  data!: TaskTemplateSummaryDto[];

  @ApiProperty({ type: () => TaskTemplateListMetaDto })
  meta!: TaskTemplateListMetaDto;
}

export class CreateTaskTemplateRequestDto {
  @ApiProperty({ example: 'Haftalık Rapor', type: String })
  title!: string;

  @ApiProperty({ example: 'Haftalık ilerleme raporunu hazırla', type: String, required: false })
  description?: string;

  @ApiProperty({ enum: Object.values(['LOW', 'MEDIUM', 'HIGH']) as string[], type: String, required: false, default: 'MEDIUM' })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ example: ['Veri topla', 'Rapor yaz'], type: [String], required: false })
  checklistSteps?: string[];

  @ApiProperty({ example: ['Ev'], type: [String], required: false })
  labelNames?: string[];

  @ApiProperty({ example: 7, type: Number, required: false })
  defaultPlannedAtOffsetDays?: number;
}

export class UpdateTaskTemplateRequestDto {
  @ApiProperty({ example: 'Haftalık Rapor', type: String, required: false })
  title?: string;

  @ApiProperty({ example: 'Haftalık ilerleme raporunu hazırla', type: String, required: false })
  description?: string | null;

  @ApiProperty({ enum: Object.values(['LOW', 'MEDIUM', 'HIGH']) as string[], type: String, required: false })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ example: ['Veri topla', 'Rapor yaz'], type: [String], required: false })
  checklistSteps?: string[];

  @ApiProperty({ example: ['Ev'], type: [String], required: false })
  labelNames?: string[];

  @ApiProperty({ example: 7, type: Number, required: false })
  defaultPlannedAtOffsetDays?: number | null;
}

export class ApplyTaskTemplateRequestDto {
  @ApiProperty({ example: 'a0000000-0000-4000-8000-000000000001', type: String, format: 'uuid', required: false })
  areaId?: string;

  @ApiProperty({ example: 'b0000000-0000-4000-8000-000000000001', type: String, format: 'uuid', required: false })
  projectId?: string;

  @ApiProperty({ example: '2026-10-01T08:00:00.000Z', type: String, required: false })
  plannedAt?: string;
}