import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';
import { PrismaService } from '../../src/platform/database/prisma.service';

jest.setTimeout(120000);

describe('task repository — kanban filters and enrichment', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let repository: TaskRepository;

  let userId: string;
  let areaA: string;
  let areaB: string;
  let todoA: string;
  let inProgressA: string;
  let todoB: string;
  let projectA: string;
  let labelA: string;
  let labelB: string;

  const rank = (n: number) => String(n).padStart(24, '0');

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
    repository = new TaskRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.taskLabel.deleteMany();
    await prisma.task.deleteMany();
    await prisma.label.deleteMany();
    await prisma.project.deleteMany();
    await prisma.areaStatus.deleteMany();
    await prisma.area.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        primaryEmail: 'kanban@example.com',
        normalizedPrimaryEmail: 'kanban@example.com',
        timeZone: 'Europe/Istanbul',
      },
    });
    userId = user.id;

    const areaARecord = await prisma.area.create({
      data: { userId, name: 'İş', normalizedName: 'is' },
    });
    areaA = areaARecord.id;
    const areaBRecord = await prisma.area.create({
      data: { userId, name: 'Kişisel', normalizedName: 'kisisel' },
    });
    areaB = areaBRecord.id;

    const statuses = await prisma.areaStatus.createManyAndReturn({
      data: [
        {
          userId,
          areaId: areaA,
          name: 'Yapılacak',
          normalizedName: 'yapilacak',
          canonicalStatus: 'TO_DO',
          position: 1,
          isDefault: true,
        },
        {
          userId,
          areaId: areaA,
          name: 'Devam Ediyor',
          normalizedName: 'devam',
          canonicalStatus: 'IN_PROGRESS',
          position: 2,
          isDefault: true,
        },
        {
          userId,
          areaId: areaA,
          name: 'Tamamlandı',
          normalizedName: 'tamamlandi',
          canonicalStatus: 'COMPLETED',
          position: 3,
          isDefault: true,
        },
        {
          userId,
          areaId: areaB,
          name: 'Yapılacak',
          normalizedName: 'yapilacak',
          canonicalStatus: 'TO_DO',
          position: 1,
          isDefault: true,
        },
      ],
    });
    const todoAStatus = statuses.find((s) => s.areaId === areaA && s.canonicalStatus === 'TO_DO');
    const inProgressAStatus = statuses.find(
      (s) => s.areaId === areaA && s.canonicalStatus === 'IN_PROGRESS',
    );
    const todoBStatus = statuses.find((s) => s.areaId === areaB && s.canonicalStatus === 'TO_DO');
    if (!todoAStatus || !inProgressAStatus || !todoBStatus) {
      throw new Error('Required area statuses missing in test fixture');
    }
    todoA = todoAStatus.id;
    inProgressA = inProgressAStatus.id;
    todoB = todoBStatus.id;

    const project = await prisma.project.create({
      data: { userId, areaId: areaA, name: 'Alışveriş', normalizedName: 'alisveris' },
    });
    projectA = project.id;

    const labelARecord = await prisma.label.create({
      data: { userId, name: 'Ev', normalizedName: 'ev' },
    });
    labelA = labelARecord.id;
    const labelBRecord = await prisma.label.create({
      data: { userId, name: 'Finans', normalizedName: 'finans' },
    });
    labelB = labelBRecord.id;

    await prisma.task.create({
      data: {
        userId,
        areaId: areaA,
        areaStatusId: todoA,
        title: 'Marketten süt al',
        priority: 'HIGH',
        projectId: projectA,
        globalRank: rank(1),
        areaRank: rank(1),
        blockedByTaskIds: [],
        labels: { create: [{ userId, labelId: labelA }] },
      },
    });
    await prisma.task.create({
      data: {
        userId,
        areaId: areaA,
        areaStatusId: todoA,
        title: 'Bankaya git',
        priority: 'LOW',
        globalRank: rank(2),
        areaRank: rank(2),
        blockedByTaskIds: [],
        labels: { create: [{ userId, labelId: labelB }] },
      },
    });
    await prisma.task.create({
      data: {
        userId,
        areaId: areaA,
        areaStatusId: inProgressA,
        title: 'Rapor yaz',
        priority: 'MEDIUM',
        globalRank: rank(3),
        areaRank: rank(1),
      },
    });
    await prisma.task.create({
      data: {
        userId,
        areaId: areaB,
        areaStatusId: todoB,
        title: 'Bahçeyi sula',
        priority: 'MEDIUM',
        globalRank: rank(4),
        areaRank: rank(1),
      },
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('returns enriched summaries with labels, project and area name', async () => {
    const result = await repository.findKanbanTasks(userId);
    const todo = result.todo.filter((t) => t.title === 'Marketten süt al');

    expect(todo).toHaveLength(1);
    expect(todo[0]).toMatchObject({
      areaName: 'İş',
      project: { id: projectA, name: 'Alışveriş' },
      blockedByTaskIds: [],
      labels: [{ id: labelA, name: 'Ev' }],
      canonicalStatus: 'TO_DO',
    });
  });

  it('filters by case-insensitive query matching all terms', async () => {
    const bySüt = await repository.findKanbanTasks(userId, { q: 'SÜT' });
    expect(bySüt.todo.map((t) => t.title)).toEqual(['Marketten süt al']);

    const byMulti = await repository.findKanbanTasks(userId, { q: 'market süt' });
    expect(byMulti.todo.map((t) => t.title)).toEqual(['Marketten süt al']);

    const byMissing = await repository.findKanbanTasks(userId, { q: 'market banka' });
    expect(byMissing.todo).toHaveLength(0);
  });

  it('filters by priority, project, label and area', async () => {
    const byPriority = await repository.findKanbanTasks(userId, { priority: 'HIGH' });
    expect(byPriority.todo.map((t) => t.title)).toEqual(['Marketten süt al']);

    const byProject = await repository.findKanbanTasks(userId, { projectId: projectA });
    expect(byProject.todo.map((t) => t.title)).toEqual(['Marketten süt al']);

    const byLabel = await repository.findKanbanTasks(userId, { labelId: labelB });
    expect(byLabel.todo.map((t) => t.title)).toEqual(['Bankaya git']);

    const byArea = await repository.findKanbanTasks(userId, { areaId: areaB });
    expect(byArea.todo.map((t) => t.title)).toEqual(['Bahçeyi sula']);
  });

  it('keeps bucketing into columns while filtering the global board', async () => {
    const result = await repository.findKanbanTasks(userId, { q: 'Rapor' });
    expect(result.todo).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
    expect(result.inProgress.map((t) => t.title)).toEqual(['Rapor yaz']);
  });

  it('filters area kanban columns by query and label', async () => {
    const byQuery = await repository.findAreaKanbanTasks(userId, areaA, { q: 'süt' });
    expect(byQuery.columns.find((c) => c.statusId === todoA)?.tasks.map((t) => t.title)).toEqual([
      'Marketten süt al',
    ]);

    const byLabel = await repository.findAreaKanbanTasks(userId, areaA, { labelId: labelB });
    expect(byLabel.columns.find((c) => c.statusId === todoA)?.tasks.map((t) => t.title)).toEqual([
      'Bankaya git',
    ]);
  });

  it('excludes tasks outside the area in area kanban', async () => {
    const result = await repository.findAreaKanbanTasks(userId, areaA, {});
    const allTitles = result.columns.flatMap((c) => c.tasks.map((t) => t.title));
    expect(allTitles).toEqual(
      expect.arrayContaining(['Marketten süt al', 'Bankaya git', 'Rapor yaz']),
    );
    expect(allTitles).not.toContain('Bahçeyi sula');
  });
});
