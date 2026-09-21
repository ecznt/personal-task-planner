import { ApiProperty } from '@nestjs/swagger';

export class TaskSnoozeActionRequestDto {
  @ApiProperty({ enum: ['PLANNED', 'DUE', 'BOTH'], type: String })
  target!: 'PLANNED' | 'DUE' | 'BOTH';

  @ApiProperty({ example: 1, type: Number, minimum: 1, maximum: 365 })
  amount!: number;

  @ApiProperty({ enum: ['MINUTES', 'HOURS', 'DAYS'], type: String })
  unit!: 'MINUTES' | 'HOURS' | 'DAYS';
}

export class ReminderSnoozeActionRequestDto {
  @ApiProperty({ example: 15, type: Number, minimum: 1, maximum: 365 })
  amount!: number;

  @ApiProperty({ enum: ['MINUTES', 'HOURS', 'DAYS'], type: String })
  unit!: 'MINUTES' | 'HOURS' | 'DAYS';
}

export class ReminderDataDto {
  @ApiProperty({ format: 'uuid', type: String })
  id!: string;

  @ApiProperty({ format: 'uuid', type: String })
  taskId!: string;

  @ApiProperty({ enum: ['PLANNED', 'DUE'], type: String })
  anchorType!: 'PLANNED' | 'DUE';

  @ApiProperty({ enum: ['OFFSET', 'AT_TIME'], type: String })
  ruleType!: 'OFFSET' | 'AT_TIME';

  @ApiProperty({ type: Number, required: false })
  offsetMinutes!: number | null;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  atTime!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty({ enum: ['SCHEDULED', 'TRIGGERED', 'SUPPRESSED', 'PAUSED', 'CANCELLED'], type: String })
  state!: string;

  @ApiProperty({ type: Number })
  version!: number;
}

export class ReminderResponseDto {
  @ApiProperty({ type: () => ReminderDataDto })
  data!: ReminderDataDto;
}