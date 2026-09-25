import { Inject, Injectable } from '@nestjs/common';

import type { FocusSession } from '../domain/focus-session.entity';
import {
  FocusSessionRepository,
  MAX_FOCUS_SESSION_MINUTES,
  MIN_FOCUS_SESSION_MINUTES,
  P2002UniqueViolation,
} from '../infrastructure/focus-session.repository';
import {
  buildPastDayRangesInTimeZone,
  parseTodayRange,
} from './date-range';
import { computeStreaks } from './focus-streak';

export type RecordFocusSessionCommand = {
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMinutes: number;
  readonly clientKey: string;
};

export type RecordFocusSessionResult =
  | { readonly outcome: 'SUCCESS'; readonly session: FocusSession; readonly created: boolean; readonly etag: number }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string };

export type ListFocusSessionsQuery = {
  readonly cursor?: string;
  readonly limit?: number;
};

export type ListFocusSessionsResult = {
  readonly outcome: 'SUCCESS';
  readonly sessions: readonly FocusSession[];
  readonly nextCursor?: string;
};

export type FocusDayStats = {
  readonly date: string;
  readonly minutes: number;
  readonly sessions: number;
};

export type FocusStatistics = {
  readonly timezone: string;
  readonly totalSessions: number;
  readonly totalMinutes: number;
  readonly todaySessions: number;
  readonly todayMinutes: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly days: readonly FocusDayStats[];
};

export type FocusStatisticsResult = {
  readonly outcome: 'SUCCESS';
  readonly statistics: FocusStatistics;
};

@Injectable()
export class FocusSessionService {
  constructor(
    @Inject(FocusSessionRepository) private readonly sessions: FocusSessionRepository,
  ) {}

  async recordFocusSession(
    userId: string,
    command: RecordFocusSessionCommand,
  ): Promise<RecordFocusSessionResult> {
    const validation = this.validate(command);
    if (validation !== undefined) {
      return { outcome: 'VALIDATION_ERROR', detail: validation };
    }

    const startedAt = new Date(command.startedAt);
    const completedAt = new Date(command.completedAt);

    try {
      const session = await this.sessions.create(userId, {
        startedAt,
        completedAt,
        durationMinutes: command.durationMinutes,
        clientKey: command.clientKey,
      });

      return { outcome: 'SUCCESS', session, created: true, etag: 1 };
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await this.sessions.findByClientKey(userId, command.clientKey);

        if (existing !== null) {
          return { outcome: 'SUCCESS', session: existing, created: false, etag: 1 };
        }
      }

      throw error;
    }
  }

  async listFocusSessions(
    userId: string,
    query: ListFocusSessionsQuery,
  ): Promise<ListFocusSessionsResult> {
    const result = await this.sessions.list(userId, query.cursor, query.limit ?? 20);

    return {
      outcome: 'SUCCESS',
      sessions: result.sessions,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }

  async getFocusStatistics(userId: string, timezone: string): Promise<FocusStatisticsResult> {
    const sessions = await this.sessions.findAll(userId);

    const today = parseTodayRange(timezone);
    const ranges = buildPastDayRangesInTimeZone(timezone, 7);

    const activeDates = new Set<string>();
    let totalMinutes = 0;
    let todaySessions = 0;
    let todayMinutes = 0;

    const bucketByDate = new Map<string, { minutes: number; sessions: number }>();
    for (const range of ranges) {
      bucketByDate.set(range.date, { minutes: 0, sessions: 0 });
    }

    for (const session of sessions) {
      totalMinutes += session.durationMinutes;
      activeDates.add(localDateKey(session.completedAt, timezone));

      if (session.completedAt >= today.todayStart && session.completedAt < today.todayEnd) {
        todaySessions += 1;
        todayMinutes += session.durationMinutes;
      }

      const day = ranges.find(
        (range) => session.completedAt >= range.start && session.completedAt < range.end,
      );

      if (day) {
        const bucket = bucketByDate.get(day.date) ?? { minutes: 0, sessions: 0 };
        bucket.minutes += session.durationMinutes;
        bucket.sessions += 1;
        bucketByDate.set(day.date, bucket);
      }
    }

    const { current, best } = computeStreaks(activeDates, today.todayStr);

    return {
      outcome: 'SUCCESS',
      statistics: {
        timezone,
        totalSessions: sessions.length,
        totalMinutes,
        todaySessions,
        todayMinutes,
        currentStreak: current,
        bestStreak: best,
        days: ranges.map((range) => ({
          date: range.date,
          minutes: bucketByDate.get(range.date)?.minutes ?? 0,
          sessions: bucketByDate.get(range.date)?.sessions ?? 0,
        })),
      },
    };
  }

  private validate(command: RecordFocusSessionCommand): string | undefined {
    if (command.clientKey.trim().length === 0) {
      return 'Odak seans anahtarı boş olamaz.';
    }

    if (command.clientKey.trim().length > 100) {
      return 'Odak seans anahtarı en fazla 100 karakter olabilir.';
    }

    if (
      !Number.isInteger(command.durationMinutes) ||
      command.durationMinutes < MIN_FOCUS_SESSION_MINUTES ||
      command.durationMinutes > MAX_FOCUS_SESSION_MINUTES
    ) {
      return `Odak süresi ${MIN_FOCUS_SESSION_MINUTES} ile ${MAX_FOCUS_SESSION_MINUTES} dakika arasında olmalıdır.`;
    }

    const now = Date.now();
    const startedAt = new Date(command.startedAt);
    const completedAt = new Date(command.completedAt);

    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(completedAt.getTime())) {
      return 'Odak seans zaman damgaları geçerli olmalıdır.';
    }

    if (completedAt.getTime() - startedAt.getTime() < 0) {
      return 'Odak seans bitişi başlangıcından önce olamaz.';
    }

    if (completedAt.getTime() > now + 10 * 60 * 1_000) {
      return 'Odak seans bitişi gelecekte olamaz.';
    }

    if (startedAt.getTime() < now - 48 * 60 * 60 * 1_000) {
      return 'Odak seans başlangıcı çok eski.';
    }

    return undefined;
  }
}

function localDateKey(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: string }).code === P2002UniqueViolation
  );
}