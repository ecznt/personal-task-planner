import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { NotificationService } from '../application/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject(NotificationService) private readonly notificationService: NotificationService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'List notifications' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'readState', required: false, enum: ['UNREAD', 'READ'] })
  @ApiResponse({ status: 200, description: 'Notifications returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async listNotifications(
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: { cursor?: string; limit?: string; readState?: string },
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const readState =
      query.readState && ['UNREAD', 'READ'].includes(query.readState)
        ? (query.readState as 'UNREAD' | 'READ')
        : undefined;

    const result = await this.notificationService.listNotifications(userId, {
      limit,
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(readState !== undefined && { readState }),
    });

    response.json({
      data: result.data.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        readState: n.readState,
        version: n.version,
        createdAt: n.createdAt.toISOString(),
        taskTitle: n.taskTitle,
        taskDueAt: n.taskDueAt?.toISOString() ?? null,
      })),
      page: {
        hasMore: result.hasMore,
        ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
      },
    });
  }

  @Get('summary')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get notification summary (unread count)' })
  @ApiResponse({ status: 200, description: 'Summary returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSummary(@Req() request: Request, @Res() response: Response): Promise<void> {
    const userId = await this.resolveUserId(request);
    const summary = await this.notificationService.getSummary(userId);

    response.json({
      data: {
        unreadCount: summary.unreadCount,
        latestAt: summary.latestAt,
      },
    });
  }

  @Patch(':notificationId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', type: String, format: 'uuid' })
  @ApiHeader({ name: 'If-Match', required: true })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async markAsRead(
    @Req() request: Request,
    @Res() response: Response,
    @Param('notificationId') notificationId: string,
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

    const marked = await this.notificationService.markAsRead(userId, notificationId);

    if (!marked) {
      throw new ApiProblemException({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        detail: 'Bildirim bulunamadı.',
      });
    }

    response.json({ data: { success: true } });
  }

  @Post('read-actions')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiResponse({ status: 200, description: 'Notifications marked as read.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async markMultipleAsRead(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: { notificationIds: string[] },
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ApiProblemException({
        status: 400,
        code: 'MISSING_IDEMPOTENCY_KEY',
        detail: 'Idempotency-Key başlığı gerekli.',
      });
    }

    if (!body.notificationIds || !Array.isArray(body.notificationIds)) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'notificationIds gerekli.',
      });
    }

    const count = await this.notificationService.markMultipleAsRead(userId, body.notificationIds);

    response.json({ data: { affectedCount: count } });
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
