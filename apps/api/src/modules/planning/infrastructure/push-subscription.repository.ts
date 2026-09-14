import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { PushSubscription } from '../domain/reminder.entity';

export type PushSubscriptionInput = {
  readonly endpoint: string;
  readonly keysP256dh: string;
  readonly keysAuth: string;
};

@Injectable()
export class PushSubscriptionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsert(userId: string, input: PushSubscriptionInput): Promise<PushSubscription> {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        userId,
        keysP256dh: input.keysP256dh,
        keysAuth: input.keysAuth,
      },
      create: {
        userId,
        endpoint: input.endpoint,
        keysP256dh: input.keysP256dh,
        keysAuth: input.keysAuth,
      },
    });
  }

  async removeByEndpoint(userId: string, endpoint: string): Promise<boolean> {
    const result = await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return result.count > 0;
  }

  async removeMany(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.prisma.pushSubscription.deleteMany({
      where: { id: { in: [...ids] } },
    });
    return result.count;
  }

  async listForUser(userId: string): Promise<readonly PushSubscription[]> {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.pushSubscription.count({ where: { userId } });
  }
}