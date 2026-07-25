import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { parseApiEnvironment } from '../../../platform/config/environment';
import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { CsrfService } from '../application/csrf.service';

@Injectable()
export class AnonymousCsrfGuard implements CanActivate {
  private readonly environment = parseApiEnvironment();

  constructor(@Inject(CsrfService) private readonly csrf: CsrfService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const csrfToken = request.headers['x-csrf-token'];
    const browserToken = parseBrowserToken(request.headers.cookie);

    if (
      typeof origin !== 'string' ||
      safeOrigin(origin) !== new URL(this.environment.PUBLIC_ORIGIN).origin ||
      typeof csrfToken !== 'string' ||
      browserToken === undefined ||
      !(await this.csrf.isValid(browserToken, csrfToken))
    ) {
      throw new ApiProblemException({
        status: 403,
        code: 'REQUEST_FORBIDDEN',
        detail: 'İstek güvenlik doğrulamasından geçemedi.',
      });
    }

    return true;
  }
}

function safeOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function parseBrowserToken(cookieHeader: string | undefined): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }

  const cookieName = anonymousCsrfCookieName();

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

export function anonymousCsrfCookieName(): string {
  return parseApiEnvironment().COOKIE_SECURE
    ? '__Host-planner-csrf-context'
    : 'planner-csrf-context';
}

function safelyDecodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
