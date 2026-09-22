import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { TaskTemplateService } from '../application/task-template.service';
import type {
  CreateTaskTemplateResult,
  DeleteTaskTemplateResult,
  ListTaskTemplatesResult,
  UpdateTaskTemplateResult,
} from '../application/task-template.service';
import type { CreateTaskResult } from '../application/task.service';
import {
  parseApplyTaskTemplateInput,
  parseCreateTaskTemplateInput,
  parseListTaskTemplatesQuery,
  parseUpdateTaskTemplateInput,
} from './task-template.schema';
import {
  ApplyTaskTemplateRequestDto,
  CreateTaskTemplateRequestDto,
  TaskTemplateListResponseDto,
  TaskTemplateResponseDto,
  UpdateTaskTemplateRequestDto,
} from './task-template.dto';
import { TaskResponseDto } from './task.dto';

@ApiTags('Task Templates')
@Controller('task-templates')
export class TaskTemplateController {
  constructor(
    @Inject(TaskTemplateService) private readonly taskTemplateService: TaskTemplateService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listTaskTemplates',
    summary: 'List User Task Templates',
  })
  @ApiResponse({
    status: 200,
    type: TaskTemplateListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listTaskTemplates(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<TaskTemplateListResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListTaskTemplatesQuery(query);

    const result = await this.taskTemplateService.listTemplates(userId, input.cursor, input.limit);

    return this.handleListResult(result);
  }

  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createTaskTemplate',
    summary: 'Create a Task Template',
  })
  @ApiBody({ type: CreateTaskTemplateRequestDto })
  @ApiResponse({
    status: 201,
    type: TaskTemplateResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async createTaskTemplate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TaskTemplateResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseCreateTaskTemplateInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.taskTemplateService.createTemplate(userId, input);

    return this.handleCreateResult(result);
  }

  @Patch(':templateId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'updateTaskTemplate',
    summary: 'Update a Task Template',
  })
  @ApiParam({ name: 'templateId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateTaskTemplateRequestDto })
  @ApiResponse({
    status: 200,
    type: TaskTemplateResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Template not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  @ApiResponse({
    description: 'Validation failed or If-Match header required.',
    status: 422,
  })
  async updateTaskTemplate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<TaskTemplateResponseDto> {
    const userId = await this.resolveUserId(request);

    const version = this.parseIfMatch(ifMatch);

    const input = parseUpdateTaskTemplateInput(body);

    const result = await this.taskTemplateService.updateTemplate(userId, {
      templateId,
      version,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.checklistSteps !== undefined && { checklistSteps: input.checklistSteps }),
      ...(input.labelNames !== undefined && { labelNames: input.labelNames }),
      ...(input.defaultPlannedAtOffsetDays !== undefined && {
        defaultPlannedAtOffsetDays: input.defaultPlannedAtOffsetDays,
      }),
    });

    return this.handleUpdateResult(result);
  }

  @Post(':templateId/apply')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'applyTaskTemplate',
    summary: 'Instantiate a Task from a Template',
  })
  @ApiParam({ name: 'templateId', type: String, format: 'uuid' })
  @ApiBody({ type: ApplyTaskTemplateRequestDto })
  @ApiResponse({
    status: 201,
    type: TaskResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Template not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async applyTaskTemplate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseApplyTaskTemplateInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.taskTemplateService.applyTemplate(userId, {
      templateId,
      ...(input.areaId !== undefined && { areaId: input.areaId }),
      projectId: input.projectId,
      plannedAt: input.plannedAt,
    });

    return this.handleApplyResult(result, response);
  }

  @Delete(':templateId')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'deleteTaskTemplate',
    summary: 'Delete a Task Template',
  })
  @ApiParam({ name: 'templateId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully.',
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Template not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  async deleteTaskTemplate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    const version = this.parseIfMatch(ifMatch);

    const result = await this.taskTemplateService.deleteTemplate(userId, templateId, version);

    this.handleDeleteResult(result, response);
  }

  private parseIfMatch(ifMatch?: string): number {
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

    return version;
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

  private handleCreateResult(result: CreateTaskTemplateResult): TaskTemplateResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return { data: toTemplateDataDto(result.template) };
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
    }
  }

  private handleUpdateResult(result: UpdateTaskTemplateResult): TaskTemplateResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return { data: toTemplateDataDto(result.template) };
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
    }
  }

  private handleApplyResult(
    result: CreateTaskResult | { readonly outcome: 'NOT_FOUND' },
    response: Response,
  ): TaskResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return toTaskDataDto(result, response);
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

  private handleDeleteResult(result: DeleteTaskTemplateResult, response: Response): void {
    switch (result.outcome) {
      case 'SUCCESS':
        response.status(204).send();
        return;
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
    }
  }

  private handleListResult(result: ListTaskTemplatesResult): TaskTemplateListResponseDto {
    return {
      data: result.templates.map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description,
        priority: template.priority,
        checklistSteps: [...template.checklistSteps],
        labelNames: [...template.labelNames],
        defaultPlannedAtOffsetDays: template.defaultPlannedAtOffsetDays,
        version: template.version,
        updatedAt: template.updatedAt.toISOString(),
      })),
      meta: {
        ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
      },
    };
  }
}

function toTemplateDataDto(template: {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays: number | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): TaskTemplateResponseDto['data'] {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    priority: template.priority,
    checklistSteps: [...template.checklistSteps],
    labelNames: [...template.labelNames],
    defaultPlannedAtOffsetDays: template.defaultPlannedAtOffsetDays,
    version: template.version,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function toTaskDataDto(
  result: {
    readonly outcome: 'SUCCESS';
    readonly task: {
      readonly id: string;
      readonly areaId: string;
      readonly title: string;
      readonly description: string | null;
      readonly plannedAt: Date | null;
      readonly dueAt: Date | null;
      readonly durationMinutes: number | null;
      readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
      readonly areaStatusId: string;
      readonly projectId: string | null;
      readonly parentTaskId: string | null;
      readonly version: number;
      readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
    };
    readonly etag: number;
  },
  response: Response,
): TaskResponseDto {
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
      durationMinutes: result.task.durationMinutes,
      priority: result.task.priority,
      areaStatusId: result.task.areaStatusId,
      canonicalStatus: 'TO_DO',
      lifecycleState: result.task.lifecycleState,
      version: result.task.version,
      labels: [],
      checklistItems: [],
      projectId: result.task.projectId,
      parentTaskId: result.task.parentTaskId,
      subtaskCount: 0,
      completedSubtaskCount: 0,
      parentTask: null,
      subtasks: [],
    },
  };
}
