import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { AreaService } from '../application/area.service';
import type {
  CreateAreaResult,
  GetAreaResult,
  ListAreasResult,
  RenameAreaResult,
  CreateAreaStatusResult,
  UpdateAreaStatusNameResult,
  RetireAreaStatusResult,
  ActivateAreaStatusResult,
  ReorderAreaStatusesResult,
} from '../application/area.service';
import { TaskService } from '../application/task.service';
import type { CreateTaskResult, ListTasksResult, ListAreaKanbanTasksResult, MoveAreaKanbanTaskResult } from '../application/task.service';
import {
  parseCreateAreaInput,
  parseListAreasQuery,
  parseRenameAreaInput,
  parseCreateAreaStatusInput,
  parseUpdateAreaStatusNameInput,
  parseReorderAreaStatusesInput,
} from './area.schema';
import {
  AreaDetailResponseDto,
  AreaListResponseDto,
  AreaResponseDto,
  CreateAreaRequestDto,
  RenameAreaRequestDto,
  CreateAreaStatusRequestDto,
  UpdateAreaStatusNameRequestDto,
  ReorderAreaStatusesRequestDto,
} from './area.dto';
import { parseCreateTaskInput, parseListTasksQuery, parseMoveAreaKanbanTaskInput } from './task.schema';
import {
  AreaKanbanResponseDto,
  CreateTaskRequestDto,
  MoveAreaKanbanTaskRequestDto,
  TaskListResponseDto,
  TaskResponseDto,
} from './task.dto';

@ApiTags('Areas', 'Tasks')
@Controller('areas')
export class AreaController {
  constructor(
    @Inject(AreaService) private readonly areaService: AreaService,
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createArea',
    summary: 'Create a new Area with default workflow statuses',
  })
  @ApiBody({ type: CreateAreaRequestDto })
  @ApiResponse({
    status: 201,
    type: AreaDetailResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async createArea(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AreaDetailResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseCreateAreaInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.areaService.createArea(userId, input);

    return this.handleCreateResult(result, response);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listAreas',
    summary: 'List active Areas for the current user',
  })
  @ApiResponse({
    status: 200,
    type: AreaListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listAreas(@Req() request: Request, @Query() query: unknown): Promise<AreaListResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListAreasQuery(query);

    const result = await this.areaService.listAreas(userId, input);

    return this.handleListResult(result);
  }

  @Get(':areaId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getArea',
    summary: 'Get Area detail with statuses and counts',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: AreaDetailResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Area not found.',
    status: 404,
  })
  async getArea(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
  ): Promise<AreaDetailResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.areaService.getArea(userId, { areaId });

    return this.handleGetResult(result, response);
  }

  @Patch(':areaId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'renameArea',
    summary: 'Rename an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiBody({ type: RenameAreaRequestDto })
  @ApiResponse({
    status: 200,
    type: AreaResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Area not found.',
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
  async renameArea(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseRenameAreaInput(body);

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

    const result = await this.areaService.renameArea(userId, {
      areaId,
      name: input.name,
      version,
    });

    return this.handleRenameResult(result, response);
  }

  @Post(':areaId/statuses')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createAreaStatus',
    summary: 'Create a new Status in an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateAreaStatusRequestDto })
  @ApiResponse({ status: 201, type: AreaResponseDto })
  @ApiResponse({ description: 'No valid authenticated session is present.', status: 401 })
  @ApiResponse({ description: 'Area not found.', status: 404 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async createAreaStatus(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseCreateAreaStatusInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı gereklidir.' });
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı geçerli bir sayı olmalıdır.' });
    }

    const result = await this.areaService.createAreaStatus(userId, {
      areaId,
      name: input.name,
      canonicalStatus: input.canonicalStatus,
      version,
    });

    return this.handleCreateAreaStatusResult(result, response);
  }

  @Patch(':areaId/statuses/:statusId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'updateAreaStatusName',
    summary: 'Rename a Status in an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiParam({ name: 'statusId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateAreaStatusNameRequestDto })
  @ApiResponse({ status: 200, type: AreaResponseDto })
  @ApiResponse({ description: 'No valid authenticated session is present.', status: 401 })
  @ApiResponse({ description: 'Status not found.', status: 404 })
  @ApiResponse({ description: 'Version conflict.', status: 409 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async updateAreaStatusName(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Param('statusId') statusId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseUpdateAreaStatusNameInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı gereklidir.' });
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı geçerli bir sayı olmalıdır.' });
    }

    const result = await this.areaService.updateAreaStatusName(userId, {
      areaId,
      statusId,
      name: input.name,
      version,
    });

    return this.handleUpdateAreaStatusNameResult(result, response);
  }

  @Post(':areaId/statuses/:statusId/retire')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'retireAreaStatus',
    summary: 'Retire a Status and migrate its Tasks to the default',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiParam({ name: 'statusId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: AreaResponseDto })
  @ApiResponse({ description: 'No valid authenticated session is present.', status: 401 })
  @ApiResponse({ description: 'Status not found.', status: 404 })
  @ApiResponse({ description: 'Version conflict.', status: 409 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async retireAreaStatus(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Param('statusId') statusId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);

    if (!ifMatch) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı gereklidir.' });
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı geçerli bir sayı olmalıdır.' });
    }

    const result = await this.areaService.retireAreaStatus(userId, {
      areaId,
      statusId,
      version,
    });

    return this.handleRetireAreaStatusResult(result, response);
  }

  @Post(':areaId/statuses/:statusId/activate')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'activateAreaStatus',
    summary: 'Reactivate a retired Status',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiParam({ name: 'statusId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, type: AreaResponseDto })
  @ApiResponse({ description: 'No valid authenticated session is present.', status: 401 })
  @ApiResponse({ description: 'Status not found.', status: 404 })
  @ApiResponse({ description: 'Version conflict.', status: 409 })
  async activateAreaStatus(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Param('statusId') statusId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);

    if (!ifMatch) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı gereklidir.' });
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı geçerli bir sayı olmalıdır.' });
    }

    const result = await this.areaService.activateAreaStatus(userId, {
      areaId,
      statusId,
      version,
    });

    return this.handleActivateAreaStatusResult(result, response);
  }

  @Put(':areaId/statuses/reorder')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'reorderAreaStatuses',
    summary: 'Reorder Statuses in an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiBody({ type: ReorderAreaStatusesRequestDto })
  @ApiResponse({ status: 200, type: AreaResponseDto })
  @ApiResponse({ description: 'No valid authenticated session is present.', status: 401 })
  @ApiResponse({ description: 'Area not found.', status: 404 })
  @ApiResponse({ description: 'Version conflict.', status: 409 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async reorderAreaStatuses(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<AreaResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseReorderAreaStatusesInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı gereklidir.' });
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: 'If-Match başlığı geçerli bir sayı olmalıdır.' });
    }

    const result = await this.areaService.reorderAreaStatuses(userId, {
      areaId,
      statusIds: input.statusIds,
      version,
    });

    return this.handleReorderAreaStatusesResult(result, response);
  }

  @Post(':areaId/tasks')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createTask',
    summary: 'Create a new Task under an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateTaskRequestDto })
  @ApiResponse({
    status: 201,
    type: TaskResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Area not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async createTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') areaId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseCreateTaskInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.taskService.createTask(userId, {
      areaId,
      title: input.title,
      description: input.description ?? null,
      plannedAt: input.plannedAt ?? null,
      dueAt: input.dueAt ?? null,
      priority: input.priority,
    });

    return this.handleCreateTaskResult(result, response);
  }

  @Get(':areaId/tasks')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listTasks',
    summary: 'List Tasks within an Area',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: TaskListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listTasks(
    @Req() request: Request,
    @Param('areaId') areaId: string,
    @Query() query: unknown,
  ): Promise<TaskListResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListTasksQuery(query);

    const result = await this.taskService.listTasks(userId, {
      areaId,
      cursor: input.cursor,
      limit: input.limit,
    });

    return this.handleListTasksResult(result);
  }

  @Get(':areaId/kanban')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listAreaKanbanTasks',
    summary: 'List Tasks in an Area as Kanban columns',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: AreaKanbanResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Area not found.',
    status: 404,
  })
  async listAreaKanbanTasks(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ): Promise<AreaKanbanResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.taskService.listAreaKanbanTasks(userId, areaId);

    return this.handleAreaKanbanResult(result);
  }

  @Post(':areaId/kanban-moves')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'moveAreaKanbanTask',
    summary: 'Move a Task between area Kanban columns',
  })
  @ApiParam({ name: 'areaId', type: String, format: 'uuid' })
  @ApiBody({ type: MoveAreaKanbanTaskRequestDto })
  @ApiResponse({
    status: 200,
    type: TaskResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Task or target status not found.',
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
  async moveAreaKanbanTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('areaId') _areaId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseMoveAreaKanbanTaskInput(body);

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

    const result = await this.taskService.moveAreaKanbanTask(userId, {
      taskId: input.taskId,
      targetAreaStatusId: input.targetAreaStatusId,
      version,
    });

    return this.handleMoveAreaKanbanResult(result, response);
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

  private handleCreateResult(result: CreateAreaResult, response: Response): AreaDetailResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.area.version));
        response.setHeader('Location', `/api/v1/areas/${result.area.id}`);
        return {
          data: {
            id: result.area.id,
            name: result.area.name,
            lifecycleState: result.area.lifecycleState,
            version: result.area.version,
            taskCount: 0,
            projectCount: 0,
            statuses: result.statuses.map((s) => ({
              id: s.id,
              name: s.name,
              canonicalStatus: s.canonicalStatus,
              position: s.position,
              isDefault: s.isDefault,
              active: s.active,
            })),
          },
        };
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

  private handleListResult(result: ListAreasResult): AreaListResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          data: result.areas.map((area) => ({
            id: area.id,
            name: area.name,
            lifecycleState: area.lifecycleState,
            taskCount: area.taskCount,
            projectCount: area.projectCount,
            overdueTaskCount: area.overdueTaskCount,
          })),
          meta: {
            ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
          },
        };
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleGetResult(result: GetAreaResult, response: Response): AreaDetailResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.data.area.version));
        return {
          data: {
            id: result.data.area.id,
            name: result.data.area.name,
            lifecycleState: result.data.area.lifecycleState,
            version: result.data.area.version,
            taskCount: result.data.taskCount,
            projectCount: result.data.projectCount,
            statuses: result.data.statuses.map((s) => ({
              id: s.id,
              name: s.name,
              canonicalStatus: s.canonicalStatus,
              position: s.position,
              isDefault: s.isDefault,
              active: s.active,
            })),
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleRenameResult(result: RenameAreaResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.area.version));
        return {
          data: {
            id: result.area.id,
            name: result.area.name,
            lifecycleState: result.area.lifecycleState,
            version: result.area.version,
          },
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

  private handleCreateTaskResult(result: CreateTaskResult, response: Response): TaskResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        response.setHeader('Location', `/api/v1/tasks/${result.task.id}`);
        return {
          data: {
            id: result.task.id,
            areaId: result.task.areaId,
            title: result.task.title,
            description: result.task.description,
            plannedAt: result.task.plannedAt?.toISOString() ?? null,
            dueAt: result.task.dueAt?.toISOString() ?? null,
            priority: result.task.priority,
            areaStatusId: result.task.areaStatusId,
            canonicalStatus: 'TO_DO',
            lifecycleState: result.task.lifecycleState,
            version: result.task.version,
            labels: [],
            checklistItems: [],
            projectId: result.task.projectId,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
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

  private handleListTasksResult(result: ListTasksResult): TaskListResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          data: result.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            canonicalStatus: task.canonicalStatus,
            dueAt: task.dueAt?.toISOString() ?? null,
            plannedAt: task.plannedAt?.toISOString() ?? null,
            lifecycleState: task.lifecycleState,
            version: task.version,
            areaId: task.areaId,
          })),
          meta: {
            ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleAreaKanbanResult(result: ListAreaKanbanTasksResult): AreaKanbanResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          statuses: result.statuses.map((s) => ({
            id: s.id,
            name: s.name,
            canonicalStatus: s.canonicalStatus,
            position: s.position,
          })),
          columns: result.columns.map((col) => ({
            statusId: col.statusId,
            count: col.count,
            tasks: col.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              priority: task.priority,
              canonicalStatus: task.canonicalStatus,
              dueAt: task.dueAt?.toISOString() ?? null,
              plannedAt: task.plannedAt?.toISOString() ?? null,
              lifecycleState: task.lifecycleState,
              version: task.version,
              areaId: task.areaId,
            })),
          })),
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleMoveAreaKanbanResult(
    result: MoveAreaKanbanTaskResult,
    response: Response,
  ): TaskResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            id: result.task.id,
            areaId: result.task.areaId,
            title: result.task.title,
            description: result.task.description,
            plannedAt: result.task.plannedAt?.toISOString() ?? null,
            dueAt: result.task.dueAt?.toISOString() ?? null,
            priority: result.task.priority,
            areaStatusId: result.task.areaStatusId,
            canonicalStatus: result.canonicalStatus,
            lifecycleState: result.task.lifecycleState,
            version: result.task.version,
            labels: [],
            checklistItems: [],
            projectId: result.task.projectId,
          },
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

  private handleCreateAreaStatusResult(result: CreateAreaStatusResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.areaVersion));
        return {
          data: {
            id: result.status.id,
            name: result.status.name,
            lifecycleState: 'ACTIVE',
            version: result.areaVersion,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
      case 'STALE_VERSION':
        throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: result.detail });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({ status: 401, code: 'AUTHENTICATION_REQUIRED', detail: 'Oturum açmanız gerekiyor.' });
    }
  }

  private handleUpdateAreaStatusNameResult(result: UpdateAreaStatusNameResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.areaVersion));
        return {
          data: {
            id: result.status.id,
            name: result.status.name,
            lifecycleState: 'ACTIVE',
            version: result.areaVersion,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
      case 'STALE_VERSION':
        throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: result.detail });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({ status: 401, code: 'AUTHENTICATION_REQUIRED', detail: 'Oturum açmanız gerekiyor.' });
    }
  }

  private handleRetireAreaStatusResult(result: RetireAreaStatusResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.areaVersion));
        return {
          data: {
            id: '',
            name: '',
            lifecycleState: 'ACTIVE',
            version: result.areaVersion,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
      case 'STALE_VERSION':
        throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: result.detail });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({ status: 401, code: 'AUTHENTICATION_REQUIRED', detail: 'Oturum açmanız gerekiyor.' });
    }
  }

  private handleActivateAreaStatusResult(result: ActivateAreaStatusResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.areaVersion));
        return {
          data: {
            id: '',
            name: '',
            lifecycleState: 'ACTIVE',
            version: result.areaVersion,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
      case 'STALE_VERSION':
        throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({ status: 401, code: 'AUTHENTICATION_REQUIRED', detail: 'Oturum açmanız gerekiyor.' });
    }
  }

  private handleReorderAreaStatusesResult(result: ReorderAreaStatusesResult, response: Response): AreaResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.areaVersion));
        return {
          data: {
            id: '',
            name: '',
            lifecycleState: 'ACTIVE',
            version: result.areaVersion,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({ status: 404, code: 'RESOURCE_NOT_FOUND', detail: 'Kaynak bulunamadı.' });
      case 'STALE_VERSION':
        throw new ApiProblemException({ status: 409, code: 'VERSION_CONFLICT', detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.' });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({ status: 422, code: 'VALIDATION_FAILED', detail: result.detail });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({ status: 401, code: 'AUTHENTICATION_REQUIRED', detail: 'Oturum açmanız gerekiyor.' });
    }
  }
}
