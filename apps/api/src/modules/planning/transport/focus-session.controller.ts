import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { FocusSessionService } from '../application/focus-session.service';
import type {
  FocusStatisticsResult,
  ListFocusSessionsResult,
  RecordFocusSessionResult,
} from '../application/focus-session.service';
import {
  CreateFocusSessionRequestDto,
  FocusSessionListResponseDto,
  FocusSessionResponseDto,
  FocusStatisticsResponseDto,
} from './focus-session.dto';
import {
  parseCreateFocusSessionInput,
  parseFocusStatisticsQuery,
  parseListFocusSessionsQuery,
} from './focus-session.schema';

@ApiTags('Focus Sessions')
@Controller('focus-sessions')
export class FocusSessionController {
  constructor(
    @Inject(FocusSessionService) private readonly focusSessionService: FocusSessionService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listFocusSessions',
    summary: 'List User Focus Sessions',
  })
  @ApiQuery({ name: 'cursor', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    type: FocusSessionListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listFocusSessions(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<FocusSessionListResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseListFocusSessionsQuery(query);

    const result = await this.focusSessionService.listFocusSessions(userId, {
      ...(input.cursor !== undefined && { cursor: input.cursor }),
      limit: input.limit,
    });

    return this.handleListResult(result);
  }

  @Get('statistics')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getFocusStatistics',
    summary: 'Get Focus Session statistics including streaks and trailing 7 days',
  })
  @ApiQuery({ name: 'timezone', type: String, required: false })
  @ApiResponse({
    status: 200,
    type: FocusStatisticsResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async getFocusStatistics(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<FocusStatisticsResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseFocusStatisticsQuery(query);

    const result = await this.focusSessionService.getFocusStatistics(userId, input.timezone);

    return this.handleStatisticsResult(result);
  }

  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'recordFocusSession',
    summary: 'Record a completed Focus Session',
  })
  @ApiBody({ type: CreateFocusSessionRequestDto })
  @ApiResponse({
    status: 201,
    type: FocusSessionResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async recordFocusSession(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<FocusSessionResponseDto> {
    const userId = await this.resolveUserId(request);

    if (!idempotencyKey) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'Idempotency-Key başlığı gereklidir.',
      });
    }

    const input = parseCreateFocusSessionInput(body);

    const result = await this.focusSessionService.recordFocusSession(userId, input);

    return this.handleCreateResult(result, response);
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

  private handleCreateResult(
    result: RecordFocusSessionResult,
    response: Response,
  ): FocusSessionResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        if (result.created) {
          response.status(201);
        } else {
          response.status(200);
        }
        response.setHeader('ETag', String(result.etag));
        response.setHeader('Location', `/api/v1/focus-sessions/${result.session.id}`);
        return { data: toSessionDataDto(result.session) };
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
    }
  }

  private handleListResult(result: ListFocusSessionsResult): FocusSessionListResponseDto {
    return {
      data: result.sessions.map(toSessionDataDto),
      meta: {
        ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
      },
    };
  }

  private handleStatisticsResult(result: FocusStatisticsResult): FocusStatisticsResponseDto {
    return {
      data: {
        timezone: result.statistics.timezone,
        totalSessions: result.statistics.totalSessions,
        totalMinutes: result.statistics.totalMinutes,
        todaySessions: result.statistics.todaySessions,
        todayMinutes: result.statistics.todayMinutes,
        currentStreak: result.statistics.currentStreak,
        bestStreak: result.statistics.bestStreak,
        days: result.statistics.days.map((day) => ({
          date: day.date,
          minutes: day.minutes,
          sessions: day.sessions,
        })),
      },
    };
  }
}

function toSessionDataDto(session: {
  readonly id: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly durationMinutes: number;
  readonly clientKey: string;
  readonly createdAt: Date;
}): FocusSessionResponseDto['data'] {
  return {
    id: session.id,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt.toISOString(),
    durationMinutes: session.durationMinutes,
    clientKey: session.clientKey,
    createdAt: session.createdAt.toISOString(),
  };
}