import { ApiProperty } from '@nestjs/swagger';

export class ChecklistItemDataDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  text!: string;

  @ApiProperty({ type: Number })
  position!: number;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  completedAt!: string | null;
}

export class ChecklistItemResponseDto {
  @ApiProperty({ type: () => ChecklistItemDataDto })
  data!: ChecklistItemDataDto;

  @ApiProperty({ type: Number })
  taskVersion!: number;
}

export class ChecklistItemListResponseDto {
  @ApiProperty({ type: () => [ChecklistItemDataDto] })
  data!: ChecklistItemDataDto[];
}

export class ChecklistOrderResponseDto {
  @ApiProperty({ type: () => [ChecklistItemDataDto] })
  data!: ChecklistItemDataDto[];

  @ApiProperty({ type: Number })
  taskVersion!: number;
}

export class AddChecklistItemRequestDto {
  @ApiProperty({ example: 'Süt al', type: String })
  text!: string;
}

export class EditChecklistItemRequestDto {
  @ApiProperty({ example: 'Tam yagli süt al', type: String })
  text!: string;
}

export class ReorderChecklistRequestDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  orderedIds!: string[];
}
