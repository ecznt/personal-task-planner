import { ApiProperty } from '@nestjs/swagger';

export class FocusSessionDataDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-09-25T08:00:00.000Z', type: String })
  startedAt!: string;

  @ApiProperty({ example: '2026-09-25T08:25:00.000Z', type: String })
  completedAt!: string;

  @ApiProperty({ example: 25, type: Number })
  durationMinutes!: number;

  @ApiProperty({ example: 'cb0a1e2f-9c34-46e8-9b23-2f4f7d93d581', type: String })
  clientKey!: string;

  @ApiProperty({ type: String })
  createdAt!: string;
}

export class FocusSessionListMetaDto {
  @ApiProperty({ type: String, format: 'uuid', required: false })
  nextCursor?: string;
}

export class FocusSessionResponseDto {
  @ApiProperty({ type: () => FocusSessionDataDto })
  data!: FocusSessionDataDto;
}

export class FocusSessionListResponseDto {
  @ApiProperty({ type: () => [FocusSessionDataDto] })
  data!: FocusSessionDataDto[];

  @ApiProperty({ type: () => FocusSessionListMetaDto })
  meta!: FocusSessionListMetaDto;
}

export class CreateFocusSessionRequestDto {
  @ApiProperty({ example: '2026-09-25T08:00:00.000Z', type: String })
  startedAt!: string;

  @ApiProperty({ example: '2026-09-25T08:25:00.000Z', type: String })
  completedAt!: string;

  @ApiProperty({ example: 25, type: Number })
  durationMinutes!: number;

  @ApiProperty({ example: 'cb0a1e2f-9c34-46e8-9b23-2f4f7d93d581', type: String })
  clientKey!: string;
}

export class FocusDayStatsDto {
  @ApiProperty({ example: '2026-09-19', type: String })
  date!: string;

  @ApiProperty({ example: 50, type: Number })
  minutes!: number;

  @ApiProperty({ example: 2, type: Number })
  sessions!: number;
}

export class FocusStatisticsDataDto {
  @ApiProperty({ example: 'Europe/Istanbul', type: String })
  timezone!: string;

  @ApiProperty({ example: 12, type: Number })
  totalSessions!: number;

  @ApiProperty({ example: 300, type: Number })
  totalMinutes!: number;

  @ApiProperty({ example: 2, type: Number })
  todaySessions!: number;

  @ApiProperty({ example: 50, type: Number })
  todayMinutes!: number;

  @ApiProperty({ example: 3, type: Number })
  currentStreak!: number;

  @ApiProperty({ example: 7, type: Number })
  bestStreak!: number;

  @ApiProperty({ type: () => [FocusDayStatsDto] })
  days!: FocusDayStatsDto[];
}

export class FocusStatisticsResponseDto {
  @ApiProperty({ type: () => FocusStatisticsDataDto })
  data!: FocusStatisticsDataDto;
}