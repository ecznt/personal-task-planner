import { Body, Controller, Header, Inject, Post, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiHeader } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { BulkActionService } from '../application/bulk-action.service';
import { parseBulkActionsInput } from './bulk.schema';
import type { BulkActionsResponseDto } from './bulk.dto';

@ApiTags('Bulk Actions')
@Controller('tasks')
export class BulkActionController {
  constructor(
    @Inject(BulkActionService) private readonly bulkActionService: BulkActionService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Post('bulk-actions')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'executeBulkActions',
    summary: 'Execute bulk actions on Tasks',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({ schema: { type: 'object' } })
  @ApiResponse({
    status: 200,
    description: 'Bulk action results returned.',
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async executeBulkActions(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ApiProblemException({
        status: 400,
        code: 'MISSING_IDEMPOTENCY_KEY',
        detail: 'Idempotency-Key başlığı gerekli.',
      });
    }

    const parsed = parseBulkActionsInput(body);

    if (!parsed.success) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'Geçersiz istek.',
        errors: parsed.issues,
      });
    }

    let results;

    if (parsed.data.operation === 'status_change') {
      results = await this.bulkActionService.executeBulkStatusChange({
        userId,
        operation: 'status_change',
        items: parsed.data.items,
        ...(parsed.data.targetCanonicalStatus !== undefined && {
          targetCanonicalStatus: parsed.data.targetCanonicalStatus,
        }),
        ...(parsed.data.targetAreaStatusId !== undefined && {
          targetAreaStatusId: parsed.data.targetAreaStatusId,
        }),
      });
    } else {
      results = await this.bulkActionService.executeBulkLabelChange({
        userId,
        operation: 'label_change',
        items: parsed.data.items,
        labelAction: parsed.data.labelAction,
        labelIds: parsed.data.labelIds,
      });
    }

    const body_response: BulkActionsResponseDto = {
      results: results.map((r) => ({
        taskId: r.taskId,
        status: r.success ? 'SUCCEEDED' : 'FAILED',
        ...(r.version !== undefined && { version: r.version }),
        ...(r.etag !== undefined && { etag: r.etag }),
        ...(r.errorCode !== undefined && { errorCode: r.errorCode }),
        ...(r.errorDetail !== undefined && { errorDetail: r.errorDetail }),
      })),
    };

    response.json(body_response);
  }

  private async resolveUserId(request: Request): Promise<string> {
    const token = parseCookieValue(request.headers.cookie, sessionCookieName());

    if (!token) {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    const now = new Date();
    const session = await this.accounts.findAuthenticatedSession({
      now,
      refreshAfter: new Date(now.getTime() - 5 * 60 * 1_000),
      refreshedIdleExpiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1_000),
      tokenHash: this.security.hashSecret(token, 'session-storage'),
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
}
