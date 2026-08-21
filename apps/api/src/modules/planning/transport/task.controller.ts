import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Inject,
  Param,
  Patch,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { TaskService } from '../application/task.service';
import type { EditTaskResult, GetTaskResult } from '../application/task.service';
import { parseEditTaskInput } from './task.schema';
import { EditTaskRequestDto, TaskResponseDto } from './task.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get(':taskId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getTask',
    summary: 'Get Task detail',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: TaskResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Task not found.',
    status: 404,
  })
  async getTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.taskService.getTask(userId, { taskId });

    return this.handleGetResult(result, response);
  }

  @Patch(':taskId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'editTask',
    summary: 'Edit Task fields',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiBody({ type: EditTaskRequestDto })
  @ApiResponse({
    status: 200,
    type: TaskResponseDto,
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
  async editTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseEditTaskInput(body);

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

    const result = await this.taskService.editTask(userId, {
      taskId,
      version,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.plannedAt !== undefined && { plannedAt: input.plannedAt }),
      ...(input.dueAt !== undefined && { dueAt: input.dueAt }),
      ...(input.priority !== undefined && input.priority !== null && { priority: input.priority }),
      ...(input.areaStatusId !== undefined &&
        input.areaStatusId !== null && {
          areaStatusId: input.areaStatusId,
        }),
      ...(input.labelIds !== undefined && { labelIds: input.labelIds }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
    });

    return this.handleEditResult(result, response);
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

  private handleGetResult(result: GetTaskResult, response: Response): TaskResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            id: result.data.task.id,
            areaId: result.data.task.areaId,
            title: result.data.task.title,
            description: result.data.task.description,
            plannedAt: result.data.task.plannedAt?.toISOString() ?? null,
            dueAt: result.data.task.dueAt?.toISOString() ?? null,
            priority: result.data.task.priority,
            areaStatusId: result.data.task.areaStatusId,
            canonicalStatus: result.data.canonicalStatus,
            lifecycleState: result.data.task.lifecycleState,
            version: result.data.task.version,
            labels: result.data.labels.map((label) => ({
              id: label.id,
              name: label.name,
            })),
            checklistItems: result.data.checklistItems.map((item) => ({
              id: item.id,
              text: item.text,
              position: item.position,
              completedAt: item.completedAt?.toISOString() ?? null,
            })),
            projectId: result.data.task.projectId,
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

  private handleEditResult(result: EditTaskResult, response: Response): TaskResponseDto {
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
