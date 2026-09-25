import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { FocusSessionRepository } from '../../src/modules/planning/infrastructure/focus-session.repository';
import { PrismaService } from '../../src/platform/database/prisma.service';

jest.setTimeout(120000);

describe('focus session repository', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let repository: FocusSessionRepository;
  let userId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18.3-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.NODE_ENV = 'test';

    const migration = spawnSync(
      'pnpm',
      ['--config.engine-strict=false', '--filter', '@planner/api', 'prisma:migrate:deploy'],
      {
        cwd: resolve(__dirname, '../../../..'),
        encoding: 'utf8',
        env: process.env,
      },
    );

    if (migration.status !== 0) {
      throw new Error(`Migration failed: ${migration.stderr || migration.stdout}`);
    }

    prisma = new PrismaService();
    await prisma.$connect();
    repository = new FocusSessionRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.focusSession.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        primaryEmail: 'focus@example.com',
        normalizedPrimaryEmail: 'focus@example.com',
        timeZone: 'Europe/Istanbul',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    await container?.stop();
  });

  it('creates, dedupes by clientKey and lists most recent first', async () => {
    const created = await repository.create(userId, {
      startedAt: new Date('2026-09-25T08:00:00.000Z'),
      completedAt: new Date('2026-09-25T08:25:00.000Z'),
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    expect(created.id).toBeDefined();
    expect(created.durationMinutes).toBe(25);

    const duplicate = await repository.findByClientKey(userId, 'client-key-1');
    expect(duplicate?.id).toBe(created.id);

    await repository.create(userId, {
      startedAt: new Date('2026-09-25T09:00:00.000Z'),
      completedAt: new Date('2026-09-25T09:45:00.000Z'),
      durationMinutes: 45,
      clientKey: 'client-key-2',
    });

    const result = await repository.list(userId, undefined, 20);
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]?.clientKey).toBe('client-key-2');
    expect(result.nextCursor).toBeUndefined();
  });

  it('paginates with a cursor', async () => {
    for (let index = 1; index <= 3; index += 1) {
      await repository.create(userId, {
        startedAt: new Date(`2026-09-2${index}T08:00:00.000Z`),
        completedAt: new Date(`2026-09-2${index}T08:30:00.000Z`),
        durationMinutes: 30,
        clientKey: `client-key-${index}`,
      });
    }

    const first = await repository.list(userId, undefined, 2);
    expect(first.sessions).toHaveLength(2);
    expect(first.nextCursor).toBeDefined();

    const second = await repository.list(userId, first.nextCursor, 2);
    expect(second.sessions).toHaveLength(1);
  });

  it('scoping prevents cross-user reads', async () => {
    await repository.create(userId, {
      startedAt: new Date('2026-09-25T08:00:00.000Z'),
      completedAt: new Date('2026-09-25T08:25:00.000Z'),
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    const other = await repository.findByClientKey('other-user-id', 'client-key-1');
    expect(other).toBeNull();
  });
});