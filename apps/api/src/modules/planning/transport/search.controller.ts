import { Controller, Get, Header, Inject, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { SearchService } from '../application/search.service';
import { parseSearchTasksQuery } from './search.schema';
import type { SearchTasksResponseDto } from './search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    @Inject(SearchService) private readonly searchService: SearchService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get('tasks')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Search tasks by title and description' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (1-200 chars)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'canonicalStatus', required: false })
  @ApiQuery({ name: 'labelId', required: false })
  @ApiQuery({ name: 'dateState', required: false })
  @ApiQuery({ name: 'timezone', required: false })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully.',
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async searchTasks(
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: unknown,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    const parsed = parseSearchTasksQuery(query);

    if (!parsed.success) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'Geçersiz sorgu parametreleri.',
        errors: parsed.issues,
      });
    }

    const result = await this.searchService.searchTasks({
      userId,
      q: parsed.data.q,
      ...(parsed.data.cursor !== undefined && { cursor: parsed.data.cursor }),
      limit: parsed.data.limit,
      sort: parsed.data.sort,
      order: parsed.data.order,
      ...(parsed.data.areaId !== undefined && { areaId: parsed.data.areaId }),
      ...(parsed.data.projectId !== undefined && { projectId: parsed.data.projectId }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.canonicalStatus !== undefined && {
        canonicalStatus: parsed.data.canonicalStatus,
      }),
      ...(parsed.data.labelId !== undefined && { labelId: parsed.data.labelId }),
      ...(parsed.data.dateState !== undefined && {
        dateState: parsed.data.dateState,
        timezone: parsed.data.timezone,
      }),
    });

    const body: SearchTasksResponseDto = {
      data: result.data.map((task) => ({
        id: task.id,
        title: task.title,
        descriptionSnippet: task.descriptionSnippet,
        priority: task.priority,
        canonicalStatus: task.canonicalStatus,
        plannedAt: task.plannedAt?.toISOString() ?? null,
        dueAt: task.dueAt?.toISOString() ?? null,
        areaId: task.areaId,
        areaName: null,
        version: task.version,
        score: task.score,
      })),
      page: {
        hasMore: result.hasMore,
        ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
      },
    };

    response.json(body);
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
