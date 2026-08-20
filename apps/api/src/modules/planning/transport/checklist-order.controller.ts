import { Body, Controller, Header, Headers, Inject, Param, Put, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { ChecklistItemService } from '../application/checklist-item.service';
import type { ReorderChecklistResult } from '../application/checklist-item.service';
import { parseReorderChecklistInput } from './checklist.schema';
import { ChecklistOrderResponseDto, ReorderChecklistRequestDto } from './checklist.dto';

@ApiTags('Checklist')
@Controller('tasks/:taskId/checklist-order')
export class ChecklistOrderController {
  constructor(
    @Inject(ChecklistItemService) private readonly checklistService: ChecklistItemService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Put()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'reorderChecklist',
    summary: 'Reorder checklist items',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiBody({ type: ReorderChecklistRequestDto })
  @ApiResponse({
    status: 200,
    type: ChecklistOrderResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Task not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async reorderChecklist(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ChecklistOrderResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseReorderChecklistInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı gereklidir.',
      });
    }

    const version = parseInt(ifMatch, 10);

    if (isNaN(version)) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı geçerli bir sayı olmalıdır.',
      });
    }

    const result = await this.checklistService.reorderChecklist(userId, {
      taskId,
      orderedIds: input.orderedIds,
      version,
    });

    return this.handleReorderResult(result, response);
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

  private handleReorderResult(
    result: ReorderChecklistResult,
    response: Response,
  ): ChecklistOrderResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.taskVersion));
        return {
          data: result.items.map((item) => ({
            id: item.id,
            text: item.text,
            position: item.position,
            completedAt: item.completedAt?.toISOString() ?? null,
          })),
          taskVersion: result.taskVersion,
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'STALE_VERSION':
        throw new ApiProblemException({
          status: 409,
          code: 'VERSION_CONFLICT',
          detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.',
        });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }
}
