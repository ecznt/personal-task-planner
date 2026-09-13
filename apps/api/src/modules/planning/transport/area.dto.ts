import { ApiProperty } from '@nestjs/swagger';

export class AreaStatusDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  id!: string;

  @ApiProperty({
    type: String,
  })
  name!: string;

  @ApiProperty({
    enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'],
    type: String,
  })
  canonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiProperty({
    type: Number,
  })
  position!: number;

  @ApiProperty({
    type: Boolean,
  })
  isDefault!: boolean;

  @ApiProperty({
    type: Boolean,
  })
  active!: boolean;
}

export class AreaDataDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  id!: string;

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
}

export class AreaDetailDataDto extends AreaDataDto {
  @ApiProperty({
    type: Number,
  })
  taskCount!: number;

  @ApiProperty({
    type: Number,
  })
  projectCount!: number;

  @ApiProperty({
    type: () => [AreaStatusDto],
  })
  statuses!: AreaStatusDto[];
}

export class AreaSummaryDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  id!: string;

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
  taskCount!: number;

  @ApiProperty({
    type: Number,
  })
  projectCount!: number;

  @ApiProperty({
    type: Number,
  })
  overdueTaskCount!: number;

  @ApiProperty({
    type: Boolean,
    description: 'Gelen Kutusu flag; at most one per user.',
  })
  isInbox!: boolean;
}

export class AreaListMetaDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
    required: false,
  })
  nextCursor?: string;
}

export class AreaResponseDto {
  @ApiProperty({
    type: () => AreaDataDto,
  })
  data!: AreaDataDto;
}

export class AreaDetailResponseDto {
  @ApiProperty({
    type: () => AreaDetailDataDto,
  })
  data!: AreaDetailDataDto;
}

export class AreaListResponseDto {
  @ApiProperty({
    type: () => [AreaSummaryDto],
  })
  data!: AreaSummaryDto[];

  @ApiProperty({
    type: () => AreaListMetaDto,
  })
  meta!: AreaListMetaDto;
}

export class CreateAreaRequestDto {
  @ApiProperty({
    example: 'Kişisel Planlama',
    type: String,
  })
  name!: string;
}

export class RenameAreaRequestDto {
  @ApiProperty({
    example: 'Yeni Alan Adı',
    type: String,
  })
  name!: string;
}

export class CreateAreaStatusRequestDto {
  @ApiProperty({ example: 'İnceleme', type: String })
  name!: string;

  @ApiProperty({
    enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'],
    type: String,
  })
  canonicalStatus!: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
}

export class UpdateAreaStatusNameRequestDto {
  @ApiProperty({ example: 'Yeni Durum Adı', type: String })
  name!: string;
}

export class ReorderAreaStatusesRequestDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  statusIds!: string[];
}
