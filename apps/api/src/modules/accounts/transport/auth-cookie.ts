import { parseApiEnvironment } from '../../../platform/config/environment';

export function anonymousCsrfCookieName(): string {
  return parseApiEnvironment().COOKIE_SECURE
    ? '__Host-planner-csrf-context'
    : 'planner-csrf-context';
}

export function sessionCookieName(): string {
  return parseApiEnvironment().COOKIE_SECURE ? '__Host-planner-session' : 'planner-session';
}

export function parseCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }

  for (const item of cookieHeader.split(';')) {
    const separatorIndex = item.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const name = item.slice(0, separatorIndex).trim();
    if (name === cookieName) {
      return safelyDecodeCookieValue(item.slice(separatorIndex + 1).trim());
    }
  }

  return undefined;
}

function safelyDecodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
