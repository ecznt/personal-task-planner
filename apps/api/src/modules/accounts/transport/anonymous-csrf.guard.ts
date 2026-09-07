import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { parseApiEnvironment, type ApiEnvironment } from '../../../platform/config/environment';
import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { CsrfService } from '../application/csrf.service';
import { anonymousCsrfCookieName, parseCookieValue } from './auth-cookie';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

@Injectable()
export class AnonymousCsrfGuard implements CanActivate {
  private readonly environment = parseApiEnvironment();

  constructor(@Inject(CsrfService) private readonly csrf: CsrfService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const csrfToken = request.headers['x-csrf-token'];
    const browserToken = parseCookieValue(request.headers.cookie, anonymousCsrfCookieName());

    if (
      typeof origin !== 'string' ||
      !isAllowedOrigin(origin, this.environment.PUBLIC_ORIGIN, this.environment.NODE_ENV) ||
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

function isAllowedOrigin(
  rawOrigin: string,
  publicOrigin: string,
  nodeEnv: ApiEnvironment['NODE_ENV'],
): boolean {
  let value: URL;
  try {
    value = new URL(rawOrigin);
  } catch {
    return false;
  }

  const expected = new URL(publicOrigin);

  if (value.origin === expected.origin) {
    return true;
  }

  if (nodeEnv === 'production') {
    return false;
  }

  return (
    value.protocol === expected.protocol &&
    value.port === expected.port &&
    LOCAL_HOSTNAMES.has(value.hostname) &&
    LOCAL_HOSTNAMES.has(expected.hostname)
  );
}

export { anonymousCsrfCookieName } from './auth-cookie';
