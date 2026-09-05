import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { LifecycleService } from '../application/lifecycle.service';
import { handleLifecycleCommandResult, resolveUserId, toKind } from './lifecycle-command.shared';
import { parseListLifecycleQuery, parseResourceType, parseRestoreInput } from './lifecycle.schema';

@ApiTags('Archive')
@Controller('archive')
export class ArchiveController {
  constructor(
    @Inject(LifecycleService) private readonly lifecycle: LifecycleService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'listArchive', summary: 'List archived roots' })
  @ApiQuery({ name: 'cursor', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Archived resources returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async list(
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: unknown,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);
    const input = parseListLifecycleQuery(query);

    const result = await this.lifecycle.list(userId, 'ARCHIVED', input.cursor, input.limit);

    if (result.outcome !== 'SUCCESS') return;
    response.json({
      data: result.data.entries.map((e) => ({
        id: e.id,
        resourceType: `${e.kind.toLowerCase()}s`,
        name: e.name,
        lifecycleState: e.lifecycleState,
        archivedAt: e.archivedAt,
        version: e.version,
      })),
      meta: {
        ...(result.data.nextCursor !== undefined && { nextCursor: result.data.nextCursor }),
      },
    });
  }

  @Get(':resourceType/:id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'getArchiveDetail', summary: 'Get archived resource detail' })
  @ApiParam({ name: 'resourceType', enum: ['areas', 'projects', 'tasks'] })
  @ApiResponse({ status: 200, description: 'Archived resource detail returned.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async detail(
    @Req() request: Request,
    @Res() response: Response,
    @Param('resourceType') resourceType: string,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);
    const kind = toKind(parseResourceType(resourceType));

    const result = await this.lifecycle.detail(userId, kind, id);

    if (result.outcome !== 'SUCCESS') {
      throw new ApiProblemException({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        detail: 'Kaynak bulunamadı.',
      });
    }
    response.setHeader('ETag', String(result.data.etag));
    response.json({
      data: {
        id: result.data.node.id,
        resourceType: `${result.data.node.kind.toLowerCase()}s`,
        name: result.data.node.name,
        lifecycleState: result.data.node.lifecycleState,
        archivedAt: result.data.node.archivedAt,
        cascadePreview: result.data.cascadePreview.map((c) => ({
          id: c.id,
          resourceType: `${c.kind.toLowerCase()}s`,
          name: c.name,
          lifecycleState: c.lifecycleState,
        })),
      },
    });
  }

  @Post(':resourceType/:id/restore')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'restoreArchived', summary: 'Restore an archived resource' })
  @ApiParam({ name: 'resourceType', enum: ['areas', 'projects', 'tasks'] })
  @ApiResponse({ status: 200, description: 'Restored.' })
  @ApiResponse({ status: 409, description: 'Conflict.' })
  @ApiResponse({ status: 422, description: 'Destination unavailable.' })
  async restore(
    @Req() request: Request,
    @Res() response: Response,
    @Param('resourceType') resourceType: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);
    const kind = toKind(parseResourceType(resourceType));

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const version = parseInt(ifMatch ?? '', 10);
    if (!ifMatch || isNaN(version)) {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'If-Match başlığı gereklidir.',
      });
    }

    const input = parseRestoreInput(body);

    const result = await this.lifecycle.restore(userId, {
      kind,
      id,
      version,
      ...(input.replacementAreaId !== undefined && { replacementAreaId: input.replacementAreaId }),
      ...(input.replacementProjectId !== undefined && {
        replacementProjectId: input.replacementProjectId,
      }),
    });

    handleLifecycleCommandResult(result, response);
  }
}
