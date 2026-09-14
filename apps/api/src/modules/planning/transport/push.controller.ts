import {
  Body,
  Controller,
  Delete,
  Header,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { PushService } from '../application/push.service';
import { resolveUserId } from './lifecycle-command.shared';

const registerPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unregisterPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});

const REQUIRED_IDEMPOTENCY_KEY_DETAIL = 'Idempotency-Key başlığı gerekli.';

@ApiTags('Push Subscriptions')
@Controller('push-subscriptions')
export class PushController {
  constructor(
    @Inject(PushService) private readonly pushService: PushService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Register a web push subscription for reminder delivery' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['endpoint', 'keys'],
      properties: {
        endpoint: { type: 'string', format: 'uri' },
        keys: {
          type: 'object',
          required: ['p256dh', 'auth'],
          properties: {
            p256dh: { type: 'string' },
            auth: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Subscription registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async register(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);

    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ApiProblemException({
        status: 400,
        code: 'MISSING_IDEMPOTENCY_KEY',
        detail: REQUIRED_IDEMPOTENCY_KEY_DETAIL,
      });
    }

    const parsed = registerPushSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'endpoint ve keys (p256dh, auth) gerekli.',
      });
    }

    const subscription = await this.pushService.enroll(userId, {
      endpoint: parsed.data.endpoint,
      keysP256dh: parsed.data.keys.p256dh,
      keysAuth: parsed.data.keys.auth,
    });

    response.status(201).json({ data: { id: subscription.id } });
  }

  @Delete()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Remove a web push subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['endpoint'],
      properties: {
        endpoint: { type: 'string', format: 'uri' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Subscription removed.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async unregister(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    const userId = await resolveUserId(request, this.accounts, this.security);

    const parsed = unregisterPushSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiProblemException({
        status: 400,
        code: 'INVALID_INPUT',
        detail: 'endpoint gerekli.',
      });
    }

    const removed = await this.pushService.remove(userId, parsed.data.endpoint);

    if (!removed) {
      throw new ApiProblemException({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        detail: 'Abonelik bulunamadı.',
      });
    }

    response.json({ data: { success: true } });
  }
}