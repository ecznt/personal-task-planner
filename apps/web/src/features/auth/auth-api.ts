import { apiClient, getAuthCsrf } from '@planner/api-client';

export const csrfQueryKey = ['auth', 'csrf'] as const;

export type CsrfData = {
  readonly token: string;
  readonly expiresAt: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export async function fetchCsrf(): Promise<CsrfData> {
  const result = await getAuthCsrf({
    client: apiClient,
  });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  if (result.data?.data === undefined) {
    throw new Error('Güvenli bağlantı kurulamadı.');
  }

  return result.data.data;
}

export function apiError(value: unknown): Error {
  if (
    typeof value === 'object' &&
    value !== null &&
    'detail' in value &&
    typeof value.detail === 'string'
  ) {
    return new AuthApiError(
      value.detail,
      'code' in value && typeof value.code === 'string' ? value.code : undefined,
    );
  }

  return new AuthApiError('İşlem tamamlanamadı. Lütfen yeniden deneyin.');
}
