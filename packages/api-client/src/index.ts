export { apiClient } from './client';
export {
  createAuthSession,
  getAuthCsrf,
  getAuthSession,
  getVersion,
  registerAccount,
  requestEmailVerification,
  verifyEmail,
} from './generated/sdk.gen';
export type {
  AuthenticatedSessionDataDto,
  CsrfTokenResponseDto,
  EmailVerificationRequestAcceptedResponseDto,
  EmailVerificationRequestDto,
  LoginRequestDtoWritable,
  LoginResponseDto,
  RegisterAccountRequestDtoWritable,
  RegistrationAcceptedResponseDto,
  SessionStateResponseDto,
  VerifyEmailRequestDtoWritable,
  VerifyEmailResponseDto,
  VersionResponseDto,
} from './generated/types.gen';
