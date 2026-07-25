import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenDataDto {
  @ApiProperty({
    description: 'Non-secret CSRF token bound to the anonymous browser transaction.',
    type: String,
  })
  token!: string;

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  expiresAt!: string;
}

export class CsrfTokenResponseDto {
  @ApiProperty({
    type: () => CsrfTokenDataDto,
  })
  data!: CsrfTokenDataDto;
}

export class RegisterAccountRequestDto {
  @ApiProperty({
    example: 'kullanici@example.com',
    format: 'email',
    maxLength: 254,
    type: String,
  })
  email!: string;

  @ApiProperty({
    format: 'password',
    minLength: 12,
    maxLength: 128,
    type: String,
    writeOnly: true,
  })
  password!: string;

  @ApiProperty({
    format: 'password',
    minLength: 12,
    maxLength: 128,
    type: String,
    writeOnly: true,
  })
  passwordConfirmation!: string;

  @ApiProperty({
    enum: [true],
    type: Boolean,
  })
  termsAccepted!: true;
}

export class RegistrationAcceptedDataDto {
  @ApiProperty({
    enum: ['VERIFICATION_REQUIRED'],
    type: String,
  })
  status!: 'VERIFICATION_REQUIRED';

  @ApiProperty({
    example: '/verify-email',
    type: String,
  })
  next!: '/verify-email';
}

export class RegistrationAcceptedResponseDto {
  @ApiProperty({
    type: () => RegistrationAcceptedDataDto,
  })
  data!: RegistrationAcceptedDataDto;
}
