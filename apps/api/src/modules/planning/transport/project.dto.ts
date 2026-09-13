import { ApiProperty } from '@nestjs/swagger';

export class ProjectDataDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  areaId!: string;

  @ApiProperty({
    type: String,
  })
  name!: string;

  @ApiProperty({
    enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'],
    type: String,
  })
  lifecycleState!: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

  @ApiProperty({
    type: Number,
  })
  version!: number;

  @ApiProperty({
    type: String,
  })
  createdAt!: string;

  @ApiProperty({
    type: String,
  })
  updatedAt!: string;

  @ApiProperty({
    type: Number,
  })
  taskCount!: number;

  @ApiProperty({
    type: Number,
  })
  completedTaskCount!: number;
}

export class ProjectSummaryDataDto extends ProjectDataDto {}

export class ProjectListMetaDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
    required: false,
  })
  nextCursor?: string;
}

export class ProjectResponseDto {
  @ApiProperty({
    type: () => ProjectSummaryDataDto,
  })
  data!: ProjectSummaryDataDto;
}

export class ProjectListResponseDto {
  @ApiProperty({
    type: () => [ProjectSummaryDataDto],
  })
  data!: ProjectSummaryDataDto[];

  @ApiProperty({
    type: () => ProjectListMetaDto,
  })
  meta!: ProjectListMetaDto;
}

export class CreateProjectRequestDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  areaId!: string;

  @ApiProperty({
    example: 'Haftalık Plan',
    type: String,
  })
  name!: string;
}

export class UpdateProjectRequestDto {
  @ApiProperty({
    example: 'Yeni Proje Adı',
    type: String,
    required: false,
  })
  name?: string;

  @ApiProperty({
    format: 'uuid',
    type: String,
    required: false,
  })
  areaId?: string;
}
