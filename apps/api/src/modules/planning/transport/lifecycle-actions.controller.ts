import {
  Body,
  Controller,
  Header,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { LifecycleService } from '../application/lifecycle.service';
import {
  handleLifecycleCommandResult,
  resolveUserId,
} from './lifecycle-command.shared';
import { parseConfirmAction } from './lifecycle.schema';

type ActionKind = 'archive' | 'trash';

@ApiTags('Lifecycle Actions')
@Controller()
export class LifecycleActionsController {
  constructor(
    @Inject(LifecycleService) private readonly lifecycle: LifecycleService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Post('areas/:id/archive')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'archiveArea', summary: 'Archive an Area and its descendants' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Archived.' })
  async archiveArea(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'archive', 'AREA', id, body, ifMatch, idempotencyKey);
  }

  @Post('projects/:id/archive')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'archiveProject', summary: 'Archive a Project and its Tasks' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Archived.' })
  async archiveProject(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'archive', 'PROJECT', id, body, ifMatch, idempotencyKey);
  }

  @Post('tasks/:id/archive')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'archiveTask', summary: 'Archive a Task' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Archived.' })
  async archiveTask(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'archive', 'TASK', id, body, ifMatch, idempotencyKey);
  }

  @Post('areas/:id/trash')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'trashArea', summary: 'Trash an Area and its descendants' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Trashed.' })
  async trashArea(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'trash', 'AREA', id, body, ifMatch, idempotencyKey);
  }

  @Post('projects/:id/trash')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'trashProject', summary: 'Trash a Project and its Tasks' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Trashed.' })
  async trashProject(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'trash', 'PROJECT', id, body, ifMatch, idempotencyKey);
  }

  @Post('tasks/:id/trash')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'trashTask', summary: 'Trash a Task' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Trashed.' })
  async trashTask(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<void> {
    await this.runAction(request, response, 'trash', 'TASK', id, body, ifMatch, idempotencyKey);
  }

  private async runAction(
    request: Request,
    response: Response,
    kind: ActionKind,
    entityKind: 'AREA' | 'PROJECT' | 'TASK',
    id: string,
    body: unknown,
    ifMatch?: string,
    idempotencyKey?: string,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);

    if (!idempotencyKey) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'Idempotency-Key başlığı gereklidir.' });
    }

    parseConfirmAction(body);

    const version = parseInt(ifMatch ?? '', 10);
    if (!ifMatch || isNaN(version)) {
      throw new ApiProblemException({ status: 428, code: 'PRECONDITION_REQUIRED', detail: 'If-Match başlığı gereklidir.' });
    }

    const result = kind === 'archive'
      ? await this.lifecycle.archive(userId, { kind: entityKind, id, version, confirmCascade: true })
      : await this.lifecycle.trash(userId, { kind: entityKind, id, version, confirmCascade: true });

    handleLifecycleCommandResult(result, response);
  }
}
