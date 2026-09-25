import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { FocusSession } from '../domain/focus-session.entity';

export type CreateFocusSessionData = {
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly durationMinutes: number;
  readonly clientKey: string;
};

export const MAX_FOCUS_SESSION_MINUTES = 240;
export const MIN_FOCUS_SESSION_MINUTES = 5;

export const P2002UniqueViolation = 'P2002';

@Injectable()
export class FocusSessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateFocusSessionData): Promise<FocusSession> {
    return this.prisma.focusSession.create({
      data: {
        userId,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        durationMinutes: data.durationMinutes,
        clientKey: data.clientKey,
      },
    });
  }

  async findByClientKey(userId: string, clientKey: string): Promise<FocusSession | null> {
    return this.prisma.focusSession.findFirst({ where: { userId, clientKey } });
  }

  async list(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ sessions: readonly FocusSession[]; nextCursor?: string }> {
    const sessions = await this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      ...(cursor !== undefined && { cursor: { id: cursor } }),
    });

    const hasMore = sessions.length > limit;
    const lastFetched = hasMore ? sessions.at(limit) : undefined;
    const nextCursor = lastFetched?.id;
    const sliced = sessions.slice(0, limit);

    return {
      sessions: sliced,
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async findAll(userId: string): Promise<FocusSession[]> {
    return this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
    });
  }

  async findCompletedBetween(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<FocusSession[]> {
    return this.prisma.focusSession.findMany({
      where: { userId, completedAt: { gte: start, lt: end } },
    });
  }
}