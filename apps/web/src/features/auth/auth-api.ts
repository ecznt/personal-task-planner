import { apiClient, getAuthCsrf } from '@planner/api-client';

export const csrfQueryKey = ['auth', 'csrf'] as const;

export type CsrfData = {
  readonly token: string;
  readonly expiresAt: string;
};

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
    return new Error(value.detail);
  }

  return new Error('İşlem tamamlanamadı. Lütfen yeniden deneyin.');
}
