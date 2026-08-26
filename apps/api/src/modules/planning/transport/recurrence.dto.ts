import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecurrenceRuleDto {
  @ApiProperty() id!: string;
  @ApiProperty() mode!: string;
  @ApiProperty() frequency!: string;
  @ApiProperty() interval!: number;
  @ApiProperty() selectedWeekdays!: number[];
  @ApiPropertyOptional() dayOfMonth!: number | null;
  @ApiPropertyOptional() monthOfYear!: number | null;
  @ApiPropertyOptional() localTime!: string | null;
  @ApiProperty() state!: string;
}

export class RecurrenceSeriesDto {
  @ApiProperty() id!: string;
  @ApiProperty() state!: string;
  @ApiProperty() currentOpenTaskId!: string | null;
  @ApiProperty() nextOccurrenceNumber!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class RecurrenceResponseDto {
  @ApiProperty({ type: RecurrenceSeriesDto }) series!: RecurrenceSeriesDto;
  @ApiProperty({ type: RecurrenceRuleDto }) activeRule!: RecurrenceRuleDto;
  @ApiProperty() currentOpenTaskId!: string | null;
}

export class RecurrenceSuccessResponseDto {
  @ApiProperty({ type: RecurrenceResponseDto }) data!: RecurrenceResponseDto;
  @ApiProperty() etag!: number;
}

export class StopRecurrenceSuccessResponseDto {
  @ApiProperty() etag!: number;
}
