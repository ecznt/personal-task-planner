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
