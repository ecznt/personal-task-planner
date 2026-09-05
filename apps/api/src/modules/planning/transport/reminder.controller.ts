import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiHeader } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { ReminderService } from '../application/reminder.service';

@ApiTags('Task Reminders')
@Controller('tasks')
export class ReminderController {
  constructor(
    @Inject(ReminderService) private readonly reminderService: ReminderService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get(':taskId/reminders')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'List reminders for a Task' })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Reminders returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async listReminders(
    @Req() request: Request,
    @Res() response: Response,
    @Param('taskId') taskId: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);
    const reminders = await this.reminderService.listReminders(userId, taskId);

    response.json({
      data: reminders.map((r) => ({
        id: r.id,
        taskId: r.taskId,
        anchorType: r.anchorType,
        ruleType: r.ruleType,
        offsetMinutes: r.offsetMinutes,
        atTime: r.atTime?.toISOString() ?? null,
        scheduledAt: r.scheduledAt.toISOString(),
        state: r.state,
        version: r.version,
      })),
    });
  }

  @Post(':taskId/reminders')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Create a reminder for a Task' })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiHeader({ name: 'If-Match', required: true })
  @ApiResponse({ status: 201, description: 'Reminder created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createReminder(
    @Req() request: Request,
    @Res() response: Response,
    @Param('taskId') taskId: string,
    @Body() body: { anchorType: string; ruleType: string; offsetMinutes?: number; atTime?: string },
    @Headers('if-match') ifMatch: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'If-Match başlığı gerekli.',
      });
    }

    if (!['PLANNED', 'DUE'].includes(body.anchorType)) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'Geçersiz anchor type.',
      });
    }

    if (!['OFFSET', 'AT_TIME'].includes(body.ruleType)) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'Geçersiz rule type.',
      });
    }

    const result = await this.reminderService.createReminder({
      userId,
      taskId,
      anchorType: body.anchorType as 'PLANNED' | 'DUE',
      ruleType: body.ruleType as 'OFFSET' | 'AT_TIME',
      ...(body.offsetMinutes !== undefined && { offsetMinutes: body.offsetMinutes }),
      ...(body.atTime !== undefined && { atTime: body.atTime }),
    });

    switch (result.outcome) {
      case 'TASK_NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Görev bulunamadı.',
        });
      case 'TASK_NO_TIME':
        throw new ApiProblemException({
          status: 422,
          code: 'REMINDER_REQUIRES_TIME',
          detail: 'Hatırlatma için görev tarihinde saat gerekli.',
        });
      case 'DUPLICATE_REMINDER':
        throw new ApiProblemException({
          status: 409,
          code: 'DUPLICATE_REMINDER',
          detail: 'Bu hatırlatma zaten mevcut.',
        });
      case 'SUCCESS': {
        const reminder = result.reminder;
        if (!reminder) break;
        response.status(201).json({
          data: {
            id: reminder.id,
            taskId: reminder.taskId,
            anchorType: reminder.anchorType,
            ruleType: reminder.ruleType,
            offsetMinutes: reminder.offsetMinutes,
            atTime: reminder.atTime?.toISOString() ?? null,
            scheduledAt: reminder.scheduledAt.toISOString(),
            state: reminder.state,
            version: reminder.version,
          },
        });
        break;
      }
    }
  }

  @Delete(':taskId/reminders/:reminderId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Cancel a reminder' })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiParam({ name: 'reminderId', type: String, format: 'uuid' })
  @ApiHeader({ name: 'If-Match', required: true })
  @ApiResponse({ status: 204, description: 'Reminder cancelled.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async cancelReminder(
    @Req() request: Request,
    @Res() response: Response,
    @Param('taskId') _taskId: string,
    @Param('reminderId') reminderId: string,
    @Headers('if-match') ifMatch: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'If-Match başlığı gerekli.',
      });
    }

    const cancelled = await this.reminderService.cancelReminder(userId, reminderId);

    if (!cancelled) {
      throw new ApiProblemException({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        detail: 'Hatırlatma bulunamadı.',
      });
    }

    response.status(204).send();
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
