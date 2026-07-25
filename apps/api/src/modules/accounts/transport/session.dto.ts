import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'kullanici@example.com',
    format: 'email',
    maxLength: 254,
    type: String,
  })
  email!: string;

  @ApiProperty({
    format: 'password',
    maxLength: 128,
    type: String,
    writeOnly: true,
  })
  password!: string;

  @ApiProperty({
    default: '/app/today',
    example: '/app/today',
    maxLength: 2_048,
    required: false,
    type: String,
  })
  returnTo?: string;
}

export class AuthenticatedSessionDataDto {
  @ApiProperty({
    type: Boolean,
  })
  authenticated!: true;

  @ApiProperty({
    format: 'email',
    type: String,
  })
  email!: string;

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  idleExpiresAt!: string;

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  absoluteExpiresAt!: string;

  @ApiProperty({
    example: '/app/today',
    type: String,
  })
  next!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    type: () => AuthenticatedSessionDataDto,
  })
  data!: AuthenticatedSessionDataDto;
}

export class SessionStateDataDto {
  @ApiProperty({
    type: Boolean,
  })
  authenticated!: boolean;

  @ApiProperty({
    format: 'email',
    required: false,
    type: String,
  })
  email?: string;

  @ApiProperty({
    format: 'date-time',
    required: false,
    type: String,
  })
  idleExpiresAt?: string;

  @ApiProperty({
    format: 'date-time',
    required: false,
    type: String,
  })
  absoluteExpiresAt?: string;
}

export class SessionStateResponseDto {
  @ApiProperty({
    type: () => SessionStateDataDto,
  })
  data!: SessionStateDataDto;
}
