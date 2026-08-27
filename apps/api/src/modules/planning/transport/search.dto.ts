import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchTaskResultDto {
  @ApiProperty({ description: 'Task unique identifier' })
  readonly id!: string;

  @ApiProperty({ description: 'Task title' })
  readonly title!: string;

  @ApiPropertyOptional({ description: 'Task description snippet', nullable: true })
  readonly descriptionSnippet!: string | null;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Task priority' })
  readonly priority!: string;

  @ApiProperty({ description: 'Canonical status resolved from Area status' })
  readonly canonicalStatus!: string;

  @ApiPropertyOptional({ description: 'Planned start date', nullable: true })
  readonly plannedAt!: string | null;

  @ApiPropertyOptional({ description: 'Due date', nullable: true })
  readonly dueAt!: string | null;

  @ApiProperty({ description: 'Area ID the task belongs to' })
  readonly areaId!: string;

  @ApiPropertyOptional({ description: 'Area name', nullable: true })
  readonly areaName!: string | null;

  @ApiProperty({ description: 'Task version for optimistic concurrency' })
  readonly version!: number;

  @ApiProperty({ description: 'Relevance score for full-text search' })
  readonly score!: number;
}

export class SearchTasksResponseDto {
  @ApiProperty({ type: [SearchTaskResultDto], description: 'Search results' })
  readonly data!: readonly SearchTaskResultDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  readonly page!: {
    readonly nextCursor?: string;
    readonly hasMore: boolean;
  };
}
