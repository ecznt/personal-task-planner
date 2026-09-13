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
import { ProjectService } from '../application/project.service';
import type {
  CreateProjectResult,
  GetProjectResult,
  ListProjectsResult,
  MoveProjectResult,
  RenameProjectResult,
} from '../application/project.service';
import { parseCreateProjectInput, parseListProjectsQuery, parseUpdateProjectInput } from './project.schema';
import {
  CreateProjectRequestDto,
  ProjectListResponseDto,
  ProjectResponseDto,
  UpdateProjectRequestDto,
} from './project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(
    @Inject(ProjectService) private readonly projectService: ProjectService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createProject',
    summary: 'Create a new Project in an Area',
  })
  @ApiBody({ type: CreateProjectRequestDto })
  @ApiResponse({
    status: 201,
    type: ProjectResponseDto,
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
    description: 'Validation failed or duplicate name.',
    status: 422,
  })
  async createProject(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ProjectResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseCreateProjectInput(body);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const result = await this.projectService.createProject(userId, input);

    return this.handleCreateResult(result, response);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listProjects',
    summary: 'List active Projects, optionally filtered by Area',
  })
  @ApiQuery({ name: 'areaId', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'cursor', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    type: ProjectListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listProjects(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<ProjectListResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseListProjectsQuery(query);

    const result = await this.projectService.listProjects(userId, {
      ...(input.areaId !== undefined && { areaId: input.areaId }),
      ...(input.cursor !== undefined && { cursor: input.cursor }),
      limit: input.limit,
    });

    return this.handleListResult(result);
  }

  @Get(':projectId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getProject',
    summary: 'Get Project detail',
  })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: ProjectResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Project not found.',
    status: 404,
  })
  async getProject(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('projectId') projectId: string,
  ): Promise<ProjectResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.projectService.getProject(userId, { projectId });

    return this.handleGetResult(result, response);
  }

  @Patch(':projectId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'updateProject',
    summary: 'Rename a Project or move it to another Area',
  })
  @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateProjectRequestDto })
  @ApiResponse({
    status: 200,
    type: ProjectResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Project or Area not found.',
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
  @ApiResponse({
    description: 'If-Match header required.',
    status: 428,
  })
  async updateProject(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ProjectResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseUpdateProjectInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
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

    if (input.areaId !== undefined) {
      const result = await this.projectService.moveProject(userId, {
        projectId,
        targetAreaId: input.areaId,
        version,
      });

      return this.handleMoveResult(result, response);
    }

    const result = await this.projectService.renameProject(userId, {
      projectId,
      name: input.name ?? '',
      version,
    });

    return this.handleRenameResult(result, response);
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

  private handleCreateResult(result: CreateProjectResult, response: Response): ProjectResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.project.version));
        response.setHeader('Location', `/api/v1/projects/${result.project.id}`);
        return {
          data: {
            id: result.project.id,
            areaId: result.project.areaId,
            name: result.project.name,
            lifecycleState: result.project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
            version: result.project.version,
            taskCount: 0,
            completedTaskCount: 0,
            createdAt: result.project.createdAt.toISOString(),
            updatedAt: result.project.updatedAt.toISOString(),
          },
        };
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'DUPLICATE_NAME':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
    }
  }

  private handleListResult(result: ListProjectsResult): ProjectListResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          data: result.projects.map((project) => ({
            id: project.id,
            areaId: project.areaId,
            name: project.name,
            lifecycleState: project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
            version: project.version,
            taskCount: project.taskCount,
            completedTaskCount: project.completedTaskCount,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          })),
          meta: {
            ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
          },
        };
    }
  }

  private handleGetResult(result: GetProjectResult, response: Response): ProjectResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.project.version));
        return {
          data: {
            id: result.project.id,
            areaId: result.project.areaId,
            name: result.project.name,
            lifecycleState: result.project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
            version: result.project.version,
            taskCount: result.project.taskCount,
            completedTaskCount: result.project.completedTaskCount,
            createdAt: result.project.createdAt.toISOString(),
            updatedAt: result.project.updatedAt.toISOString(),
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
    }
  }

  private handleRenameResult(result: RenameProjectResult, response: Response): ProjectResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.project.version));
        return {
          data: {
            id: result.project.id,
            areaId: result.project.areaId,
            name: result.project.name,
            lifecycleState: result.project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
            version: result.project.version,
            taskCount: 0,
            completedTaskCount: 0,
            createdAt: result.project.createdAt.toISOString(),
            updatedAt: result.project.updatedAt.toISOString(),
          },
        };
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
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
      case 'DUPLICATE_NAME':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
    }
  }

  private handleMoveResult(result: MoveProjectResult, response: Response): ProjectResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.project.version));
        return {
          data: {
            id: result.project.id,
            areaId: result.project.areaId,
            name: result.project.name,
            lifecycleState: result.project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
            version: result.project.version,
            taskCount: 0,
            completedTaskCount: 0,
            createdAt: result.project.createdAt.toISOString(),
            updatedAt: result.project.updatedAt.toISOString(),
          },
        };
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
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
      case 'DUPLICATE_NAME':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
    }
  }
}
