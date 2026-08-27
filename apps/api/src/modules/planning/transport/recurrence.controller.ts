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
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { RecurrenceService } from '../application/recurrence.service';
import type { GetRecurrenceResult, SetRecurrenceResult, StopRecurrenceResult } from '../application/recurrence.service';
import { parseSetRecurrenceInput } from './recurrence.schema';
import {
  RecurrenceSuccessResponseDto,
  StopRecurrenceSuccessResponseDto,
} from './recurrence.dto';

@ApiTags('Recurrence')
@Controller('tasks')
export class RecurrenceController {
  constructor(
    @Inject(RecurrenceService) private readonly recurrenceService: RecurrenceService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Put(':taskId/recurrence')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'setTaskRecurrence',
    summary: 'Set recurrence rule on a Task',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiResponse({
    status: 200,
    type: RecurrenceSuccessResponseDto,
  })
  @ApiResponse({ description: 'Not found.', status: 404 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async setRecurrence(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<RecurrenceSuccessResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseSetRecurrenceInput(body);

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

    const result = await this.recurrenceService.setRecurrence(userId, {
      taskId,
      mode: input.mode,
      frequency: input.frequency,
      interval: input.interval,
      selectedWeekdays: input.selectedWeekdays,
      dayOfMonth: input.dayOfMonth ?? null,
      monthOfYear: input.monthOfYear ?? null,
      localTime: input.localTime ?? null,
    });

    return this.handleSetResult(result, response);
  }

  @Get(':taskId/recurrence')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getTaskRecurrence',
    summary: 'Get recurrence info for a Task',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: RecurrenceSuccessResponseDto,
  })
  @ApiResponse({ description: 'Not found.', status: 404 })
  async getRecurrence(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
  ): Promise<RecurrenceSuccessResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.recurrenceService.getRecurrence(userId, { taskId });

    return this.handleGetResult(result, response);
  }

  @Delete(':taskId/recurrence')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'stopTaskRecurrence',
    summary: 'Stop recurrence on a Task',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: StopRecurrenceSuccessResponseDto,
  })
  @ApiResponse({ description: 'Not found.', status: 404 })
  @ApiResponse({ description: 'Validation failed.', status: 422 })
  async stopRecurrence(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<StopRecurrenceSuccessResponseDto> {
    const userId = await this.resolveUserId(request);

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

    const result = await this.recurrenceService.stopRecurrence(userId, { taskId });

    return this.handleStopResult(result, response);
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

  private handleSetResult(result: SetRecurrenceResult, response: Response): RecurrenceSuccessResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            series: {
              id: result.recurrence.series.id,
              state: result.recurrence.series.state,
              currentOpenTaskId: result.recurrence.series.currentOpenTaskId,
              nextOccurrenceNumber: result.recurrence.series.nextOccurrenceNumber,
              createdAt: result.recurrence.series.createdAt.toISOString(),
              updatedAt: result.recurrence.series.updatedAt.toISOString(),
            },
            activeRule: {
              id: result.recurrence.activeRule.id,
              mode: result.recurrence.activeRule.mode,
              frequency: result.recurrence.activeRule.frequency,
              interval: result.recurrence.activeRule.interval,
              selectedWeekdays: [...result.recurrence.activeRule.selectedWeekdays],
              dayOfMonth: result.recurrence.activeRule.dayOfMonth,
              monthOfYear: result.recurrence.activeRule.monthOfYear,
              localTime: result.recurrence.activeRule.localTime,
              state: result.recurrence.activeRule.state,
            },
            currentOpenTaskId: result.recurrence.currentOpenTaskId,
          },
          etag: result.etag,
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

  private handleGetResult(result: GetRecurrenceResult, response: Response): RecurrenceSuccessResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            series: {
              id: result.recurrence.series.id,
              state: result.recurrence.series.state,
              currentOpenTaskId: result.recurrence.series.currentOpenTaskId,
              nextOccurrenceNumber: result.recurrence.series.nextOccurrenceNumber,
              createdAt: result.recurrence.series.createdAt.toISOString(),
              updatedAt: result.recurrence.series.updatedAt.toISOString(),
            },
            activeRule: {
              id: result.recurrence.activeRule.id,
              mode: result.recurrence.activeRule.mode,
              frequency: result.recurrence.activeRule.frequency,
              interval: result.recurrence.activeRule.interval,
              selectedWeekdays: [...result.recurrence.activeRule.selectedWeekdays],
              dayOfMonth: result.recurrence.activeRule.dayOfMonth,
              monthOfYear: result.recurrence.activeRule.monthOfYear,
              localTime: result.recurrence.activeRule.localTime,
              state: result.recurrence.activeRule.state,
            },
            currentOpenTaskId: result.recurrence.currentOpenTaskId,
          },
          etag: result.etag,
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

  private handleStopResult(result: StopRecurrenceResult, response: Response): StopRecurrenceSuccessResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return { etag: result.etag };
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
}
