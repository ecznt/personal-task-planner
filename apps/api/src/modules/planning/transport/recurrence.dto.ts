import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecurrenceRuleDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  mode!: string;

  @ApiProperty({ type: String })
  frequency!: string;

  @ApiProperty({ type: Number })
  interval!: number;

  @ApiProperty({ type: [Number] })
  selectedWeekdays!: number[];

  @ApiPropertyOptional({ type: Number })
  dayOfMonth!: number | null;

  @ApiPropertyOptional({ type: Number })
  monthOfYear!: number | null;

  @ApiPropertyOptional({ type: String })
  localTime!: string | null;

  @ApiProperty({ type: String })
  state!: string;
}

export class RecurrenceSeriesDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ type: String })
  state!: string;

  @ApiPropertyOptional({ type: String })
  currentOpenTaskId!: string | null;

  @ApiProperty({ type: Number })
  nextOccurrenceNumber!: number;

  @ApiProperty({ type: String })
  createdAt!: string;

  @ApiProperty({ type: String })
  updatedAt!: string;
}

export class RecurrenceResponseDto {
  @ApiProperty({ type: () => RecurrenceSeriesDto })
  series!: RecurrenceSeriesDto;

  @ApiProperty({ type: () => RecurrenceRuleDto })
  activeRule!: RecurrenceRuleDto;

  @ApiPropertyOptional({ type: String })
  currentOpenTaskId!: string | null;
}

export class RecurrenceSuccessResponseDto {
  @ApiProperty({ type: () => RecurrenceResponseDto })
  data!: RecurrenceResponseDto;

  @ApiProperty({ type: Number })
  etag!: number;
}

export class StopRecurrenceSuccessResponseDto {
  @ApiProperty({ type: Number })
  etag!: number;
}
