import { describe, expect, it, jest } from '@jest/globals';

import { LifecycleService } from '../../src/modules/planning/application/lifecycle.service';
import type { PrismaService } from '../../src/platform/database/prisma.service';
import type { LifecycleRepository } from '../../src/modules/planning/infrastructure/lifecycle.repository';

function nodeFactory(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'TASK',
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    name: 'Test task',
    lifecycleState: 'ACTIVE',
    areaId: 'bbbbbbbb-0000-4000-8000-000000000001',
    projectId: null,
    archivedAt: null,
    trashedAt: null,
    purgeAfter: null,
    version: 1,
    ...overrides,
  };
}

function buildTx() {
  return {
    task: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      update: jest.fn(async () => ({})),
      delete: jest.fn(async () => ({})),
    },
    project: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      update: jest.fn(async () => ({})),
      delete: jest.fn(async () => ({})),
    },
    area: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      update: jest.fn(async () => ({})),
      delete: jest.fn(async () => ({})),
    },
    areaStatus: {
      findFirst: jest.fn(async () => null),
    },
    taskReminder: {
      updateMany: jest.fn(async () => ({})),
      findMany: jest.fn(async () => []),
      deleteMany: jest.fn(async () => ({})),
    },
    notification: { deleteMany: jest.fn(async () => ({})) },
    checklistItem: { deleteMany: jest.fn(async () => ({})) },
    taskLabel: { deleteMany: jest.fn(async () => ({})) },
    lifecycleEffect: {
      create: jest.fn(async () => ({})),
      findMany: jest.fn(async () => []),
    },
    lifecycleOperation: {
      update: jest.fn(async () => ({})),
    },
  };
}

function prismaMock() {
  return {
    $transaction: jest.fn().mockImplementation(async (cb: unknown) => {
      const fixture = buildTx();
      const cbAny = cb as (tx: ReturnType<typeof buildTx>) => unknown;
      return cbAny(fixture);
    }),
    lifecycleOperation: {
      findFirst: jest.fn(async () => null),
    },
  } as unknown as PrismaService;
}

function repoMock(): jest.Mocked<LifecycleRepository> {
  return {
    findOrigin: jest.fn(),
    listLifecycleEntries: jest.fn(),
    findAffectedCounts: jest.fn(),
    createOperation: jest.fn(async () => ({ id: 'op-id', version: 1 })),
    completeOperation: jest.fn(async () => undefined),
    archive: jest.fn(),
    trash: jest.fn(),
    restore: jest.fn(),
    permanentDelete: jest.fn(),
  } as unknown as jest.Mocked<LifecycleRepository>;
}

const TASK_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

describe('lifecycle service', () => {
  it('refuses to archive a non-active resource', async () => {
    const repository = repoMock();
    repository.findOrigin.mockResolvedValue(nodeFactory({ lifecycleState: 'ARCHIVED' }) as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.archive('user-id', {
      kind: 'TASK',
      id: TASK_ID,
      version: 1,
      confirmCascade: true,
    });

    expect(result).toEqual({
      outcome: 'INVALID_STATE',
      detail: 'Yalnızca aktif kaynaklar arşivlenebilir.',
    });
  });

  it('archives a task and reports cascade counts', async () => {
    const repository = repoMock();
    repository.findOrigin
      .mockResolvedValueOnce(nodeFactory() as never)
      .mockResolvedValueOnce(nodeFactory({ lifecycleState: 'ARCHIVED' }) as never);
    repository.archive.mockResolvedValue({ affected: { tasks: 3, projects: 0, areas: 0 } } as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.archive('user-id', {
      kind: 'TASK',
      id: TASK_ID,
      version: 1,
      confirmCascade: true,
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      data: expect.objectContaining({
        id: TASK_ID,
        lifecycleState: 'ARCHIVED',
        operationId: 'op-id',
        affected: { tasks: 3, projects: 0, areas: 0 },
      }),
    });
  });

  it('trash returns NOT_FOUND for unknown resource', async () => {
    const repository = repoMock();
    repository.findOrigin.mockResolvedValue(null as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.trash('user-id', {
      kind: 'TASK',
      id: TASK_ID,
      version: 1,
      confirmCascade: true,
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('restore returns STALE_VERSION when version does not match', async () => {
    const repository = repoMock();
    repository.findOrigin.mockResolvedValue(nodeFactory({ lifecycleState: 'TRASHED', version: 2 }) as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.restore('user-id', { kind: 'TASK', id: TASK_ID, version: 1 });

    expect(result).toEqual({ outcome: 'STALE_VERSION' });
  });

  it('permanent delete returns NOT_FOUND when not trashed', async () => {
    const repository = repoMock();
    repository.findOrigin.mockResolvedValue(nodeFactory() as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.permanentDelete('user-id', { kind: 'TASK', id: TASK_ID, version: 1 });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns DESTINATION_UNAVAILABLE when restore has no valid destination', async () => {
    const repository = repoMock();
    repository.findOrigin
      .mockResolvedValueOnce(nodeFactory({ lifecycleState: 'TRASHED' }) as never)
      .mockResolvedValueOnce(nodeFactory({ lifecycleState: 'ACTIVE' }) as never);
    repository.restore.mockResolvedValue({ affected: { tasks: 0, projects: 0, areas: 0 }, restored: false } as never);

    const service = new LifecycleService(prismaMock(), repository);

    const result = await service.restore('user-id', { kind: 'TASK', id: TASK_ID, version: 1 });

    expect(result).toEqual({
      outcome: 'DESTINATION_UNAVAILABLE',
      detail: 'Hedef alan/öğe mevcut değil.',
    });
  });
});
