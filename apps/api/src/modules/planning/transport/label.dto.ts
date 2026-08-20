import { ApiProperty } from '@nestjs/swagger';

export class LabelDataDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: Number })
  version!: number;
}

export class LabelSummaryDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;
}

export class LabelListMetaDto {
  @ApiProperty({ format: 'uuid', type: String, required: false })
  nextCursor?: string;
}

export class LabelResponseDto {
  @ApiProperty({ type: () => LabelDataDto })
  data!: LabelDataDto;
}

export class LabelListResponseDto {
  @ApiProperty({ type: () => [LabelSummaryDto] })
  data!: LabelSummaryDto[];

  @ApiProperty({ type: () => LabelListMetaDto })
  meta!: LabelListMetaDto;
}

export class CreateLabelRequestDto {
  @ApiProperty({ example: 'Alisveris', type: String })
  name!: string;
}

export class RenameLabelRequestDto {
  @ApiProperty({ example: 'Alisveris Listesi', type: String })
  name!: string;
}
