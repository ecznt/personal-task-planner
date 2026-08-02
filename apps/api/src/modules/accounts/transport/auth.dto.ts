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

export class EmailVerificationRequestDto {
  @ApiProperty({
    example: 'kullanici@example.com',
    format: 'email',
    maxLength: 254,
    type: String,
  })
  email!: string;
}

export class EmailVerificationRequestAcceptedDataDto {
  @ApiProperty({
    enum: ['VERIFICATION_EMAIL_SENT_IF_ELIGIBLE'],
    type: String,
  })
  status!: 'VERIFICATION_EMAIL_SENT_IF_ELIGIBLE';
}

export class EmailVerificationRequestAcceptedResponseDto {
  @ApiProperty({
    type: () => EmailVerificationRequestAcceptedDataDto,
  })
  data!: EmailVerificationRequestAcceptedDataDto;
}

export class VerifyEmailRequestDto {
  @ApiProperty({
    example: 'kullanici@example.com',
    format: 'email',
    maxLength: 254,
    type: String,
  })
  email!: string;

  @ApiProperty({
    example: '12345678',
    maxLength: 8,
    minLength: 8,
    pattern: '^\\d{8}$',
    type: String,
    writeOnly: true,
  })
  code!: string;
}

export class VerifyEmailDataDto {
  @ApiProperty({
    enum: ['VERIFIED'],
    type: String,
  })
  status!: 'VERIFIED';

  @ApiProperty({
    example: '/login',
    type: String,
  })
  next!: '/login';
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    type: () => VerifyEmailDataDto,
  })
  data!: VerifyEmailDataDto;
}

export class PasswordResetRequestDto {
  @ApiProperty({
    example: 'kullanici@example.com',
    format: 'email',
    maxLength: 254,
    type: String,
  })
  email!: string;
}

export class PasswordResetRequestAcceptedDataDto {
  @ApiProperty({
    enum: ['PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE'],
    type: String,
  })
  status!: 'PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE';
}

export class PasswordResetRequestAcceptedResponseDto {
  @ApiProperty({
    type: () => PasswordResetRequestAcceptedDataDto,
  })
  data!: PasswordResetRequestAcceptedDataDto;
}

export class ResetPasswordRequestDto {
  @ApiProperty({
    minLength: 32,
    maxLength: 512,
    type: String,
    writeOnly: true,
  })
  token!: string;

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
}

export class ReauthenticationRequestDto {
  @ApiProperty({
    enum: ['ACCOUNT_DELETION'],
    type: String,
  })
  action!: 'ACCOUNT_DELETION';

  @ApiProperty({
    format: 'password',
    maxLength: 128,
    type: String,
    writeOnly: true,
  })
  password!: string;
}

export class ReauthenticationDataDto {
  @ApiProperty({
    enum: ['ACCOUNT_DELETION'],
    type: String,
  })
  action!: 'ACCOUNT_DELETION';

  @ApiProperty({
    enum: ['REAUTHENTICATED'],
    type: String,
  })
  status!: 'REAUTHENTICATED';

  @ApiProperty({
    format: 'date-time',
    type: String,
  })
  expiresAt!: string;
}

export class ReauthenticationResponseDto {
  @ApiProperty({
    type: () => ReauthenticationDataDto,
  })
  data!: ReauthenticationDataDto;
}
