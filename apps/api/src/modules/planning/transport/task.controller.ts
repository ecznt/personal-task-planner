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
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { TaskService } from '../application/task.service';
import type {
  CreateTaskResult,
  EditTaskResult,
  GetTaskResult,
  ListGlobalTasksResult,
  ListKanbanTasksResult,
  ListTodayTasksResult,
  ListUpcomingTasksResult,
  MoveKanbanTaskResult,
} from '../application/task.service';
import type { TaskSummary } from '../domain/task.entity';
import {
  parseCreateTaskRequestInput,
  parseEditTaskInput,
  parseListGlobalTasksQuery,
  parseListTodayTasksQuery,
  parseListUpcomingTasksQuery,
  parseMoveKanbanTaskInput,
} from './task.schema';
import {
  EditTaskRequestDto,
  GlobalCreateTaskRequestDto,
  KanbanResponseDto,
  MoveKanbanTaskRequestDto,
  TaskListResponseDto,
  TaskResponseDto,
  TodayResponseDto,
  UpcomingResponseDto,
} from './task.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listGlobalTasks',
    summary: 'List active Tasks across all Areas',
  })
  @ApiQuery({ name: 'cursor', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @ApiQuery({ name: 'order', type: String, required: false })
  @ApiQuery({ name: 'areaId', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'projectId', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'priority', type: String, required: false })
  @ApiQuery({ name: 'canonicalStatus', type: String, required: false })
  @ApiQuery({ name: 'labelId', type: String, format: 'uuid', required: false })
  @ApiResponse({
    status: 200,
    type: TaskListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listGlobalTasks(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<TaskListResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListGlobalTasksQuery(query);

    const result = await this.taskService.listGlobalTasks(userId, {
      ...(input.cursor !== undefined && { cursor: input.cursor }),
      limit: input.limit,
      sort: input.sort,
      order: input.order,
      ...(input.areaId !== undefined && { areaId: input.areaId }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.canonicalStatus !== undefined && { canonicalStatus: input.canonicalStatus }),
      ...(input.labelId !== undefined && { labelId: input.labelId }),
    });

    return this.handleListGlobalTasksResult(result);
  }

  @Get('today')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listTodayTasks',
    summary: 'Get Today planning view',
  })
  @ApiQuery({ name: 'timezone', type: String, required: false })
  @ApiResponse({
    status: 200,
    type: TodayResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listTodayTasks(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<TodayResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListTodayTasksQuery(query);

    const result = await this.taskService.listTodayTasks(userId, {
      timezone: input.timezone,
    });

    return this.handleListTodayTasksResult(result);
  }

  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createGlobalTask',
    summary: 'Create a Task anywhere, or in the Inbox when areaId is omitted',
  })
  @ApiBody({ type: GlobalCreateTaskRequestDto })
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
  async createGlobalTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseCreateTaskRequestInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.taskService.createTask(userId, {
      ...(input.areaId !== undefined && input.areaId !== null && { areaId: input.areaId }),
      title: input.title,
      description: input.description ?? null,
      plannedAt: input.plannedAt ?? null,
      dueAt: input.dueAt ?? null,
      priority: input.priority,
      projectId: input.projectId ?? null,
      labelIds: input.labelIds ?? [],
      checklistItems: input.checklistItems ?? [],
      recurrence:
        input.recurrence === null || input.recurrence === undefined
          ? null
          : {
              mode: input.recurrence.mode,
              frequency: input.recurrence.frequency,
              interval: input.recurrence.interval,
              selectedWeekdays: [...input.recurrence.selectedWeekdays],
              dayOfMonth: input.recurrence.dayOfMonth ?? null,
              monthOfYear: input.recurrence.monthOfYear ?? null,
              localTime: input.recurrence.localTime ?? null,
            },
    });

    return this.handleCreateGlobalTaskResult(result, response);
  }

  @Get('upcoming')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listUpcomingTasks',
    summary: 'Get upcoming Tasks grouped by day',
  })
  @ApiQuery({ name: 'timezone', type: String, required: false })
  @ApiQuery({ name: 'days', type: Number, required: false })
  @ApiResponse({
    status: 200,
    type: UpcomingResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listUpcomingTasks(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<UpcomingResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListUpcomingTasksQuery(query);

    const result = await this.taskService.listUpcomingTasks(userId, {
      timezone: input.timezone,
      days: input.days,
    });

    return this.handleListUpcomingTasksResult(result);
  }

  @Get('kanban')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listKanbanTasks',
    summary: 'Get Global Kanban view',
  })
  @ApiResponse({
    status: 200,
    type: KanbanResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listKanbanTasks(@Req() request: Request): Promise<KanbanResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.taskService.listKanbanTasks(userId);

    return this.handleListKanbanTasksResult(result);
  }

  @Post('kanban-moves')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'moveKanbanTask',
    summary: 'Move Task between Kanban groups',
  })
  @ApiBody({ type: MoveKanbanTaskRequestDto })
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
  async moveKanbanTask(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<TaskResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseMoveKanbanTaskInput(body);

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

    const result = await this.taskService.moveKanbanTask(userId, {
      taskId: input.taskId,
      targetCanonicalStatus: input.targetCanonicalStatus,
      version,
    });

    return this.handleMoveKanbanTaskResult(result, response);
  }

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
            recurrence: result.data.recurrence
              ? {
                  series: {
                    id: result.data.recurrence.series.id,
                    state: result.data.recurrence.series.state,
                    currentOpenTaskId: result.data.recurrence.series.currentOpenTaskId,
                    nextOccurrenceNumber: result.data.recurrence.series.nextOccurrenceNumber,
                    createdAt: result.data.recurrence.series.createdAt.toISOString(),
                    updatedAt: result.data.recurrence.series.updatedAt.toISOString(),
                  },
                  activeRule: {
                    id: result.data.recurrence.activeRule.id,
                    mode: result.data.recurrence.activeRule.mode,
                    frequency: result.data.recurrence.activeRule.frequency,
                    interval: result.data.recurrence.activeRule.interval,
                    selectedWeekdays: [...result.data.recurrence.activeRule.selectedWeekdays],
                    dayOfMonth: result.data.recurrence.activeRule.dayOfMonth,
                    monthOfYear: result.data.recurrence.activeRule.monthOfYear,
                    localTime: result.data.recurrence.activeRule.localTime,
                    state: result.data.recurrence.activeRule.state,
                  },
                  currentOpenTaskId: result.data.recurrence.currentOpenTaskId,
                }
              : null,
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

  private handleListGlobalTasksResult(result: ListGlobalTasksResult): TaskListResponseDto {
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
    }
  }

  private handleListTodayTasksResult(result: ListTodayTasksResult): TodayResponseDto {
    return {
      today: result.today,
      timezone: result.timezone,
      overdue: {
        count: result.overdue.length,
        tasks: result.overdue.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus: task.canonicalStatus,
          dueAt: task.dueAt?.toISOString() ?? null,
          plannedAt: task.plannedAt?.toISOString() ?? null,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
          reasons: [...task.reasons],
        })),
      },
      plannedToday: {
        count: result.plannedToday.length,
        tasks: result.plannedToday.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus: task.canonicalStatus,
          dueAt: task.dueAt?.toISOString() ?? null,
          plannedAt: task.plannedAt?.toISOString() ?? null,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
          reasons: [...task.reasons],
        })),
      },
      dueToday: {
        count: result.dueToday.length,
        tasks: result.dueToday.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus: task.canonicalStatus,
          dueAt: task.dueAt?.toISOString() ?? null,
          plannedAt: task.plannedAt?.toISOString() ?? null,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
          reasons: [...task.reasons],
        })),
      },
      completedToday: {
        count: result.completedToday.length,
        tasks: result.completedToday.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus: task.canonicalStatus,
          dueAt: task.dueAt?.toISOString() ?? null,
          plannedAt: task.plannedAt?.toISOString() ?? null,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
          reasons: [...task.reasons],
        })),
      },
    };
  }

  private handleListUpcomingTasksResult(
    result: ListUpcomingTasksResult,
  ): UpcomingResponseDto {
    const mapTasks = (tasks: readonly TaskSummary[]) =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        canonicalStatus: task.canonicalStatus,
        dueAt: task.dueAt?.toISOString() ?? null,
        plannedAt: task.plannedAt?.toISOString() ?? null,
        lifecycleState: task.lifecycleState,
        version: task.version,
        areaId: task.areaId,
      }));

    return {
      timezone: result.timezone,
      overdue: mapTasks(result.overdue),
      days: result.days.map((day) => ({
        date: day.date,
        planned: mapTasks(day.planned),
        due: mapTasks(day.due),
      })),
    };
  }

  private handleCreateGlobalTaskResult(
    result: CreateTaskResult,
    response: Response,
  ): TaskResponseDto {
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

  private handleListKanbanTasksResult(result: ListKanbanTasksResult): KanbanResponseDto {
    const mapTasks = (tasks: readonly TaskSummary[]) =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        canonicalStatus: task.canonicalStatus,
        dueAt: task.dueAt?.toISOString() ?? null,
        plannedAt: task.plannedAt?.toISOString() ?? null,
        lifecycleState: task.lifecycleState,
        version: task.version,
        areaId: task.areaId,
      }));

    return {
      todo: { count: result.todo.length, tasks: mapTasks(result.todo) },
      inProgress: { count: result.inProgress.length, tasks: mapTasks(result.inProgress) },
      completed: { count: result.completed.length, tasks: mapTasks(result.completed) },
    };
  }

  private handleMoveKanbanTaskResult(
    result: MoveKanbanTaskResult,
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
}
