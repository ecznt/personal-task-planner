import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserProfileDataDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  id!: string;

  @ApiProperty({
    format: 'email',
    type: String,
  })
  email!: string;

  @ApiProperty({
    example: 'UTC',
    type: String,
  })
  timeZone!: string;

  @ApiProperty({
    enum: ['PENDING', 'COMPLETED'],
    type: String,
  })
  onboardingState!: 'PENDING' | 'COMPLETED';

  @ApiProperty({
    enum: ['ACTIVE', 'DELETION_CONFIRMED'],
    type: String,
  })
  accountLifecycleState!: 'ACTIVE' | 'DELETION_CONFIRMED';

  @ApiProperty({
    type: Boolean,
  })
  inAppReminderNotificationsEnabled!: boolean;
}

export class CurrentUserProfileResponseDto {
  @ApiProperty({
    type: () => CurrentUserProfileDataDto,
  })
  data!: CurrentUserProfileDataDto;
}

export class UpdateCurrentUserRequestDto {
  @ApiProperty({
    example: true,
    required: false,
    type: Boolean,
  })
  inAppReminderNotificationsEnabled?: boolean;

  @ApiProperty({
    example: 'Europe/Istanbul',
    required: false,
    type: String,
  })
  timeZone?: string;
}

export class OnboardingCompletionRequestDto {
  @ApiProperty({
    enum: ['CREATE_SAMPLE_DATA', 'START_EMPTY'],
    type: String,
  })
  choice!: 'CREATE_SAMPLE_DATA' | 'START_EMPTY';
}

export class OnboardingCompletionDataDto {
  @ApiProperty({
    enum: ['COMPLETED'],
    type: String,
  })
  status!: 'COMPLETED';

  @ApiProperty({
    enum: ['CREATE_SAMPLE_DATA', 'START_EMPTY'],
    type: String,
  })
  choice!: 'CREATE_SAMPLE_DATA' | 'START_EMPTY';

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  completedAt!: string;

  @ApiProperty({
    enum: ['/app/today'],
    type: String,
  })
  next!: '/app/today';

  @ApiProperty({
    type: () => CurrentUserProfileDataDto,
  })
  user!: CurrentUserProfileDataDto;
}

export class OnboardingCompletionResponseDto {
  @ApiProperty({
    type: () => OnboardingCompletionDataDto,
  })
  data!: OnboardingCompletionDataDto;
}

export class AccountDeletionRequestDto {
  @ApiProperty({
    enum: ['DELETE_MY_ACCOUNT'],
    type: String,
  })
  confirmation!: 'DELETE_MY_ACCOUNT';

  @ApiProperty({
    enum: [true],
    type: Boolean,
  })
  acknowledgedPermanentDeletion!: true;
}

export class AccountDeletionProcessDataDto {
  @ApiProperty({
    format: 'uuid',
    type: String,
  })
  processId!: string;

  @ApiProperty({
    enum: ['PENDING_PRIMARY_PURGE'],
    type: String,
  })
  state!: 'PENDING_PRIMARY_PURGE';

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  requestedAt!: string;

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  accessRevokedAt!: string;

  @ApiProperty({
    type: Boolean,
  })
  primaryPurgePending!: true;
}

export class AccountDeletionProcessResponseDto {
  @ApiProperty({
    type: () => AccountDeletionProcessDataDto,
  })
  data!: AccountDeletionProcessDataDto;
}
