export { apiClient } from './client';
export { getAuthCsrf, getVersion, registerAccount } from './generated/sdk.gen';
export type {
  CsrfTokenResponseDto,
  RegisterAccountRequestDtoWritable,
  RegistrationAcceptedResponseDto,
  VersionResponseDto,
} from './generated/types.gen';
