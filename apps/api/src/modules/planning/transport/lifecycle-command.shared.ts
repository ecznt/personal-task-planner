import type { Response, Request } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import type { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import type { LifecycleCommandResult } from '../application/lifecycle.service';

export type { LifecycleCommandResult };

export async function resolveUserId(
  request: Request,
  accounts: AccountsRepository,
  security: AuthSecurityService,
): Promise<string> {
  const token = parseCookieValue(request.headers.cookie, sessionCookieName());

  if (!token) {
    throw new ApiProblemException({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      detail: 'Oturum açmanız gerekiyor.',
    });
  }

  const now = new Date();
  const session = await accounts.findAuthenticatedSession({
    now,
    refreshAfter: new Date(now.getTime() - 5 * 60 * 1_000),
    refreshedIdleExpiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1_000),
    tokenHash: security.hashSecret(token, 'session-storage'),
  });

  if (session === null) {
    throw new ApiProblemException({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      detail: 'Oturum açmanız gerekiyor.',
    });
  }

  return session.userId;
}

export function toKind(resourceType: 'areas' | 'projects' | 'tasks'): 'AREA' | 'PROJECT' | 'TASK' {
  if (resourceType === 'areas') return 'AREA';
  if (resourceType === 'projects') return 'PROJECT';
  return 'TASK';
}

export function handleLifecycleCommandResult(result: LifecycleCommandResult, response: Response): void {
  switch (result.outcome) {
    case 'SUCCESS':
      response.setHeader('ETag', String(result.data.version));
      response.json({
        data: {
          id: result.data.id,
          lifecycleState: result.data.lifecycleState,
          version: result.data.version,
          operationId: result.data.operationId,
          ...(result.data.purgeAfter !== null && { purgeAfter: result.data.purgeAfter }),
          affected: {
            tasks: result.data.affected.tasks,
            projects: result.data.affected.projects,
            areas: result.data.affected.areas,
          },
        },
      });
      break;
    case 'NOT_FOUND':
      throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
    case 'STALE_VERSION':
      throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
    case 'INVALID_STATE':
      throw new ApiProblemException({ status: 409, code: 'INVALID_LIFECYCLE_STATE', detail: result.detail });
    case 'DESTINATION_UNAVAILABLE':
      throw new ApiProblemException({ status: 422, code: 'DESTINATION_UNAVAILABLE', detail: result.detail });
  }
}
