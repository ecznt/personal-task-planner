import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Prisma } from '../../../platform/database/generated/client/client';
import type {
  LifecycleAddressedListEntry,
  LifecycleCascadeCounts,
  LifecycleEntityKind,
  LifecycleManagedNode,
  LifecycleOperationKind,
} from '../domain/lifecycle.entity';

const PERMANENT_DELETE_ENTITY_KIND: Record<LifecycleEntityKind, string> = {
  AREA: 'area',
  PROJECT: 'project',
  TASK: 'task',
};

type MutableCounts = { tasks: number; projects: number; areas: number };

@Injectable()
export class LifecycleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findOrigin(userId: string, kind: LifecycleEntityKind, id: string): Promise<LifecycleManagedNode | null> {
    const model = PERMANENT_DELETE_ENTITY_KIND[kind];
    if (model === 'area') {
      const row = await this.prisma.area.findFirst({
        where: { id, userId },
        select: {
          id: true,
          name: true,
          lifecycleState: true,
          archivedAt: true,
          trashedAt: true,
          purgeAfter: true,
          version: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        id: row.id,
        name: row.name,
        lifecycleState: row.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
        areaId: null,
        projectId: null,
        archivedAt: row.archivedAt?.toISOString() ?? null,
        trashedAt: row.trashedAt?.toISOString() ?? null,
        purgeAfter: row.purgeAfter?.toISOString() ?? null,
        version: row.version,
      };
    }
    if (model === 'project') {
      const row = await this.prisma.project.findFirst({
        where: { id, userId },
        select: {
          id: true,
          name: true,
          lifecycleState: true,
          areaId: true,
          archivedAt: true,
          trashedAt: true,
          purgeAfter: true,
          version: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        id: row.id,
        name: row.name,
        lifecycleState: row.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
        areaId: row.areaId,
        projectId: null,
        archivedAt: row.archivedAt?.toISOString() ?? null,
        trashedAt: row.trashedAt?.toISOString() ?? null,
        purgeAfter: row.purgeAfter?.toISOString() ?? null,
        version: row.version,
      };
    }
    const row = await this.prisma.task.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        lifecycleState: true,
        areaId: true,
        projectId: true,
        archivedAt: true,
        trashedAt: true,
        purgeAfter: true,
        version: true,
      },
    });
    if (!row) return null;
    return {
      kind,
      id: row.id,
      name: row.title,
      lifecycleState: row.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
      areaId: row.areaId,
      projectId: row.projectId,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      trashedAt: row.trashedAt?.toISOString() ?? null,
      purgeAfter: row.purgeAfter?.toISOString() ?? null,
      version: row.version,
    };
  }

  async findParentForRestore(userId: string, kind: LifecycleEntityKind, id: string): Promise<LifecycleManagedNode | null> {
    if (kind === 'PROJECT') {
      const row = await this.prisma.project.findFirst({
        where: { id, userId },
        select: { areaId: true },
      });
      if (!row) return null;
      return this.findOrigin(userId, 'AREA', row.areaId);
    }
    if (kind === 'TASK') {
      const row = await this.prisma.task.findFirst({
        where: { id, userId },
        select: { areaId: true, projectId: true },
      });
      if (!row) return null;
      return this.findOrigin(userId, 'AREA', row.areaId);
    }
    return this.findOrigin(userId, 'AREA', id);
  }

  async listLifecycleEntries(
    userId: string,
    state: 'ARCHIVED' | 'TRASHED',
    cursor: string | undefined,
    limit: number,
  ): Promise<{ readonly entries: LifecycleAddressedListEntry[]; readonly nextCursor: string | undefined }> {
    const cursorDate = cursor ? new Date(cursor) : undefined;

    const taskRows = await this.prisma.task.findMany({
      where: {
        userId,
        lifecycleState: state,
        ...(cursorDate && { trashedAt: { lt: cursorDate } }),
      },
      select: { id: true, title: true, areaId: true, projectId: true, archivedAt: true, trashedAt: true, purgeAfter: true, version: true, dueAt: true },
      orderBy: { trashedAt: 'desc' },
      take: limit + 1,
    });

    const projectRows = await this.prisma.project.findMany({
      where: {
        userId,
        lifecycleState: state,
        ...(cursorDate && { trashedAt: { lt: cursorDate } }),
      },
      select: { id: true, name: true, areaId: true, archivedAt: true, trashedAt: true, purgeAfter: true, version: true },
      orderBy: { trashedAt: 'desc' },
      take: limit + 1,
    });

    const areaRows = await this.prisma.area.findMany({
      where: {
        userId,
        lifecycleState: state,
        ...(cursorDate && { trashedAt: { lt: cursorDate } }),
      },
      select: { id: true, name: true, archivedAt: true, trashedAt: true, purgeAfter: true, version: true },
      orderBy: { trashedAt: 'desc' },
      take: limit + 1,
    });

    const combined: LifecycleAddressedListEntry[] = [
      ...taskRows.map((r) => ({
        id: r.id,
        name: r.title,
        lifecycleState: state as 'ARCHIVED' | 'TRASHED',
        archivedAt: r.archivedAt?.toISOString() ?? null,
        trashedAt: r.trashedAt?.toISOString() ?? null,
        purgeAfter: r.purgeAfter?.toISOString() ?? null,
        version: r.version,
        areaId: r.areaId,
        projectId: r.projectId,
        dueAt: r.dueAt?.toISOString() ?? null,
      })),
      ...projectRows.map((r) => ({
        id: r.id,
        name: r.name,
        lifecycleState: state as 'ARCHIVED' | 'TRASHED',
        archivedAt: r.archivedAt?.toISOString() ?? null,
        trashedAt: r.trashedAt?.toISOString() ?? null,
        purgeAfter: r.purgeAfter?.toISOString() ?? null,
        version: r.version,
        areaId: r.areaId,
        projectId: null,
        dueAt: null,
      })),
      ...areaRows.map((r) => ({
        id: r.id,
        name: r.name,
        lifecycleState: state as 'ARCHIVED' | 'TRASHED',
        archivedAt: r.archivedAt?.toISOString() ?? null,
        trashedAt: r.trashedAt?.toISOString() ?? null,
        purgeAfter: r.purgeAfter?.toISOString() ?? null,
        version: r.version,
        areaId: null,
        projectId: null,
        dueAt: null,
      })),
    ];

    combined.sort((a, b) => {
      const aTime = (state === 'TRASHED' ? a.trashedAt : a.archivedAt) ?? '';
      const bTime = (state === 'TRASHED' ? b.trashedAt : b.archivedAt) ?? '';
      return bTime.localeCompare(aTime);
    });

    const hasMore = combined.length > limit;
    const paged = hasMore ? combined.slice(0, limit) : combined;

    const lastEntry = paged.length > 0 ? paged[paged.length - 1] : undefined;
    const nextCursor = hasMore && lastEntry !== undefined
      ? (lastEntry.trashedAt ?? lastEntry.archivedAt ?? undefined)
      : undefined;

    return {
      entries: paged,
      nextCursor,
    };
  }

  async createOperation(
    userId: string,
    kind: LifecycleOperationKind,
    rootKind: LifecycleEntityKind,
    rootId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ readonly id: string; readonly version: number }> {
    const created = await tx.lifecycleOperation.create({
      data: { userId, kind, rootKind, rootId },
      select: { id: true, version: true },
    });
    return { id: created.id, version: created.version };
  }

  async completeOperation(operationId: string, tx: Prisma.TransactionClient): Promise<void> {
    await tx.lifecycleOperation.update({
      where: { id: operationId },
      data: {
        state: 'COMPLETED',
        completedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  async findAffectedCounts(operationId: string): Promise<LifecycleCascadeCounts> {
    const effects = await this.prisma.lifecycleEffect.findMany({
      where: { operationId },
      select: { affectedKind: true },
    });
    const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
    for (const effect of effects) {
      if (effect.affectedKind === 'TASK') counts.tasks++;
      else if (effect.affectedKind === 'PROJECT') counts.projects++;
      else counts.areas++;
    }
    return counts;
  }

  async archive(tx: Prisma.TransactionClient, userId: string, id: string, kind: LifecycleEntityKind, operationId: string, now: Date): Promise<{ readonly affected: LifecycleCascadeCounts }> {
    const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
    const state = 'ARCHIVED' as const;

    if (kind === 'AREA') {
      const area = await tx.area.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } });
      if (!area) return { affected: counts };
      if (area.lifecycleState === 'ACTIVE') {
        await tx.area.update({ where: { id }, data: { lifecycleState: state, archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
        await this.recordEffect(tx, operationId, userId, 'AREA', id, area.lifecycleState, state, now, area.archivedAt, area.trashedAt, area.purgeAfter);
        counts.areas++;
      }

      for (const project of await tx.project.findMany({ where: { areaId: id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } })) {
        if (project.lifecycleState === 'ACTIVE') {
          await tx.project.update({ where: { id: project.id }, data: { lifecycleState: state, archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
          await this.recordEffect(tx, operationId, userId, 'PROJECT', project.id, project.lifecycleState, state, now, project.archivedAt, project.trashedAt, project.purgeAfter);
          counts.projects++;
        }
        await this.archiveTasksUnder(tx, userId, project.id, operationId, now, counts);
      }

      await this.archiveActiveTasksUnderArea(tx, userId, id, operationId, now, counts);
      return { affected: counts };
    }

    if (kind === 'PROJECT') {
      const project = await tx.project.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } });
      if (!project) return { affected: counts };
      if (project.lifecycleState === 'ACTIVE') {
        await tx.project.update({ where: { id }, data: { lifecycleState: state, archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
        await this.recordEffect(tx, operationId, userId, 'PROJECT', id, project.lifecycleState, state, now, project.archivedAt, project.trashedAt, project.purgeAfter);
        counts.projects++;
      }
      await this.archiveTasksUnder(tx, userId, id, operationId, now, counts);
      return { affected: counts };
    }

    const task = await tx.task.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } });
    if (!task) return { affected: counts };
    if (task.lifecycleState === 'ACTIVE') {
      await tx.task.update({ where: { id }, data: { lifecycleState: state, archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
      await this.recordEffect(tx, operationId, userId, 'TASK', id, task.lifecycleState, state, now, task.archivedAt, task.trashedAt, task.purgeAfter);
      counts.tasks++;
    }
    await this.pauseRemindersAndRecurrence(tx, userId, id);
    return { affected: counts };
  }

  async trash(tx: Prisma.TransactionClient, userId: string, id: string, kind: LifecycleEntityKind, operationId: string, now: Date): Promise<{ readonly affected: LifecycleCascadeCounts }> {
    const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
    const purgeAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);

    if (kind === 'AREA') {
      const area = await tx.area.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED', 'TRASHED'] } } });
      if (!area || area.lifecycleState === 'TRASHED') return { affected: counts };
      await this.trashAreaRecord(tx, area, operationId, now, purgeAfter, counts);

      for (const project of await tx.project.findMany({ where: { areaId: id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } })) {
        await this.trashProjectRecord(tx, project, operationId, now, purgeAfter, counts);
        await this.trashTasksUnder(tx, userId, project.id, operationId, now, counts);
      }
      await this.trashActiveTasksUnderArea(tx, userId, id, operationId, now, counts);
      return { affected: counts };
    }

    if (kind === 'PROJECT') {
      const project = await tx.project.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } });
      if (!project) return { affected: counts };
      await this.trashProjectRecord(tx, project, operationId, now, purgeAfter, counts);
      await this.trashTasksUnder(tx, userId, id, operationId, now, counts);
      return { affected: counts };
    }

    const task = await tx.task.findFirst({ where: { id, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } });
    if (!task) return { affected: counts };
    await this.trashTaskRecord(tx, task, operationId, now, purgeAfter, counts);
    await this.pauseRemindersAndRecurrence(tx, userId, id);
    return { affected: counts };
  }

  async restore(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    kind: LifecycleEntityKind,
    operationId: string,
    now: Date,
    options: { readonly replacementAreaId?: string; readonly replacementProjectId?: string },
  ): Promise<{ readonly affected: LifecycleCascadeCounts; readonly restored: boolean }> {
    const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };

    if (kind === 'AREA') {
      const area = await tx.area.findFirst({ where: { id, userId, lifecycleState: { in: ['ARCHIVED', 'TRASHED'] } } });
      if (!area) return { affected: counts, restored: false };
      const prev = area.lifecycleState as 'ARCHIVED' | 'TRASHED';
      const archivedAt = prev === 'TRASHED' && area.archivedAt ? area.archivedAt : now;
      await tx.area.update({
        where: { id },
        data: { lifecycleState: 'ACTIVE', archivedAt, trashedAt: null, purgeAfter: null, currentLifecycleOperationId: operationId, version: { increment: 1 } },
      });
      await this.recordEffect(tx, operationId, userId, 'AREA', id, prev, 'ACTIVE', now, area.archivedAt, area.trashedAt, area.purgeAfter);
      counts.areas++;

      for (const project of await tx.project.findMany({ where: { areaId: id, userId, lifecycleState: { in: ['ARCHIVED', 'TRASHED'] } } })) {
        await this.restoreChildProject(tx, userId, project, operationId, now, counts);
      }
      await this.restoreTasksByParent(tx, userId, { areaId: id }, operationId, now, counts);
      return { affected: counts, restored: true };
    }

    if (kind === 'PROJECT') {
      const project = await tx.project.findFirst({ where: { id, userId, lifecycleState: { in: ['ARCHIVED', 'TRASHED'] } } });
      if (!project) return { affected: counts, restored: false };
      const area = await tx.area.findFirst({ where: { id: project.areaId, userId, lifecycleState: 'ACTIVE' } });
      if (!area) {
        if (!options.replacementAreaId) return { affected: counts, restored: false };
        const replacementArea = await tx.area.findFirst({ where: { id: options.replacementAreaId, userId, lifecycleState: 'ACTIVE' } });
        if (!replacementArea) return { affected: counts, restored: false };
        await tx.project.update({ where: { id }, data: { areaId: replacementArea.id, lifecycleState: 'ACTIVE', archivedAt: null, trashedAt: null, purgeAfter: null, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
        await this.recordEffect(tx, operationId, userId, 'PROJECT', id, project.lifecycleState, 'ACTIVE', now, project.archivedAt, project.trashedAt, project.purgeAfter, undefined, replacementArea.id);
        counts.projects++;
        await this.restoreTasksByParent(tx, userId, { projectId: id }, operationId, now, counts);
        return { affected: counts, restored: true };
      }
      await this.restoreChildProject(tx, userId, project, operationId, now, counts);
      await this.restoreTasksByParent(tx, userId, { projectId: id }, operationId, now, counts);
      return { affected: counts, restored: true };
    }

    const task = await tx.task.findFirst({ where: { id, userId, lifecycleState: { in: ['ARCHIVED', 'TRASHED'] } } });
    if (!task) return { affected: counts, restored: false };
    const area = await tx.area.findFirst({ where: { id: task.areaId, userId, lifecycleState: 'ACTIVE' } });
    if (!area) {
      if (!options.replacementAreaId) return { affected: counts, restored: false };
      const replacementArea = await tx.area.findFirst({ where: { id: options.replacementAreaId, userId, lifecycleState: 'ACTIVE' } });
      if (!replacementArea) return { affected: counts, restored: false };
      await this.restoreTaskWithDestination(tx, userId, task, operationId, now, replacementArea.id, null, counts);
      return { affected: counts, restored: true };
    }
    if (task.projectId) {
      const project = await tx.project.findFirst({ where: { id: task.projectId, userId, lifecycleState: 'ACTIVE' } });
      if (!project) {
        if (options.replacementProjectId) {
          const replacementProject = await tx.project.findFirst({ where: { id: options.replacementProjectId, userId, lifecycleState: 'ACTIVE', areaId: area.id } });
          if (replacementProject) {
            await this.restoreTaskWithDestination(tx, userId, task, operationId, now, area.id, replacementProject.id, counts);
            return { affected: counts, restored: true };
          }
        }
        await this.restoreTaskWithDestination(tx, userId, task, operationId, now, area.id, null, counts);
        return { affected: counts, restored: true };
      }
    }
    await this.restoreTaskWithDestination(tx, userId, task, operationId, now, task.areaId, task.projectId, counts);
    return { affected: counts, restored: true };
  }

  async permanentDelete(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    kind: LifecycleEntityKind,
    operationId: string,
  ): Promise<{ readonly affected: LifecycleCascadeCounts; readonly deleted: boolean }> {
    const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };

    if (kind === 'AREA') {
      const area = await tx.area.findFirst({ where: { id, userId, lifecycleState: 'TRASHED', purgeAfter: { lte: new Date() } } });
      if (!area) return { affected: counts, deleted: false };
      await this.deleteAreaRecords(tx, userId, id, counts);
      await tx.lifecycleOperation.update({ where: { id: operationId }, data: { state: 'COMPLETED', completedAt: new Date(), version: { increment: 1 } } });
      return { affected: counts, deleted: true };
    }

    if (kind === 'PROJECT') {
      const project = await tx.project.findFirst({ where: { id, userId, lifecycleState: 'TRASHED', purgeAfter: { lte: new Date() } } });
      if (!project) return { affected: counts, deleted: false };
      await this.deleteProjectRecords(tx, userId, id, counts);
      await tx.lifecycleOperation.update({ where: { id: operationId }, data: { state: 'COMPLETED', completedAt: new Date(), version: { increment: 1 } } });
      return { affected: counts, deleted: true };
    }

    const task = await tx.task.findFirst({ where: { id, userId, lifecycleState: 'TRASHED', purgeAfter: { lte: new Date() } } });
    if (!task) return { affected: counts, deleted: false };
    await this.deleteTaskRecords(tx, id, counts);
    await tx.lifecycleOperation.update({ where: { id: operationId }, data: { state: 'COMPLETED', completedAt: new Date(), version: { increment: 1 } } });
    return { affected: counts, deleted: true };
  }

  async purgeExpiredTombstones(userId: string): Promise<{ readonly tasks: number; readonly projects: number; readonly areas: number }> {
    const now = new Date();
    const result = { tasks: 0, projects: 0, areas: 0 };

    const controller = await this.prisma.$transaction(async (tx) => {
      const tasks = await tx.task.findMany({ where: { userId, lifecycleState: 'TRASHED', purgeAfter: { lte: now } }, select: { id: true } });
      for (const task of tasks) {
        await this.deleteTaskRecords(tx, task.id, { tasks: 0, projects: 0, areas: 0 });
        result.tasks++;
      }
      const areas = await tx.area.findMany({ where: { userId, lifecycleState: 'TRASHED', purgeAfter: { lte: now } }, select: { id: true } });
      for (const area of areas) {
        await this.deleteAreaRecords(tx, userId, area.id, { tasks: 0, projects: 0, areas: 0 });
        result.areas++;
      }
      return result;
    });

    return controller;
  }

  async purgeExpiredAcrossAllUsers(): Promise<{ readonly receipts: number }> {
    const now = new Date();
    let receipts = 0;

    await this.prisma.$transaction(async (tx) => {
      const tasks = await tx.task.findMany({
        where: { lifecycleState: 'TRASHED', purgeAfter: { lte: now } },
        select: { id: true, userId: true },
      });
      for (const task of tasks) {
        const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
        await this.deleteTaskRecords(tx, task.id, counts);
        await tx.deletionReceipt.create({
          data: { userId: task.userId, entityKind: 'TASK', entityId: task.id, origin: 'AUTO_TRASH_EXPIRY' },
        });
        receipts++;
      }

      const projects = await tx.project.findMany({
        where: { lifecycleState: 'TRASHED', purgeAfter: { lte: now } },
        select: { id: true, userId: true },
      });
      for (const project of projects) {
        const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
        await this.deleteProjectRecords(tx, project.userId, project.id, counts);
        await tx.deletionReceipt.create({
          data: { userId: project.userId, entityKind: 'PROJECT', entityId: project.id, origin: 'AUTO_TRASH_EXPIRY' },
        });
        receipts++;
      }

      const areas = await tx.area.findMany({
        where: { lifecycleState: 'TRASHED', purgeAfter: { lte: now } },
        select: { id: true, userId: true },
      });
      for (const area of areas) {
        const counts: MutableCounts = { tasks: 0, projects: 0, areas: 0 };
        await this.deleteAreaRecords(tx, area.userId, area.id, counts);
        await tx.deletionReceipt.create({
          data: { userId: area.userId, entityKind: 'AREA', entityId: area.id, origin: 'AUTO_TRASH_EXPIRY' },
        });
        receipts++;
      }
    });

    return { receipts };
  }

  private async archiveTasksUnder(tx: Prisma.TransactionClient, userId: string, projectId: string, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    for (const task of await tx.task.findMany({ where: { projectId, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } })) {
      if (task.lifecycleState === 'ACTIVE') {
        await tx.task.update({ where: { id: task.id }, data: { lifecycleState: 'ARCHIVED', archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
        await this.recordEffect(tx, operationId, userId, 'TASK', task.id, task.lifecycleState, 'ARCHIVED', now, task.archivedAt, task.trashedAt, task.purgeAfter);
        counts.tasks++;
      }
      await this.pauseRemindersAndRecurrence(tx, userId, task.id);
    }
  }

  private async archiveActiveTasksUnderArea(tx: Prisma.TransactionClient, userId: string, areaId: string, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    for (const task of await tx.task.findMany({ where: { areaId, projectId: null, userId, lifecycleState: 'ACTIVE' } })) {
      await tx.task.update({ where: { id: task.id }, data: { lifecycleState: 'ARCHIVED', archivedAt: now, currentLifecycleOperationId: operationId, version: { increment: 1 } } });
      await this.recordEffect(tx, operationId, userId, 'TASK', task.id, 'ACTIVE', 'ARCHIVED', now, null, null, null);
      counts.tasks++;
      await this.pauseRemindersAndRecurrence(tx, userId, task.id);
    }
  }

  private async trashAreaRecord(tx: Prisma.TransactionClient, area: { id: string; userId: string; lifecycleState: string; archivedAt: Date | null; trashedAt: Date | null; purgeAfter: Date | null }, operationId: string, now: Date, purgeAfter: Date, counts: MutableCounts): Promise<void> {
    await tx.area.update({
      where: { id: area.id },
      data: { lifecycleState: 'TRASHED', trashedAt: now, purgeAfter, currentLifecycleOperationId: operationId, version: { increment: 1 } },
    });
    await this.recordEffect(tx, operationId, area.userId, 'AREA', area.id, area.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED', 'TRASHED', now, area.archivedAt, area.trashedAt, area.purgeAfter);
    counts.areas++;
  }

  private async trashProjectRecord(tx: Prisma.TransactionClient, project: { id: string; userId: string; lifecycleState: string; archivedAt: Date | null; trashedAt: Date | null; purgeAfter: Date | null }, operationId: string, now: Date, purgeAfter: Date, counts: MutableCounts): Promise<void> {
    await tx.project.update({
      where: { id: project.id },
      data: { lifecycleState: 'TRASHED', trashedAt: now, purgeAfter, currentLifecycleOperationId: operationId, version: { increment: 1 } },
    });
    await this.recordEffect(tx, operationId, project.userId, 'PROJECT', project.id, project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED', 'TRASHED', now, project.archivedAt, project.trashedAt, project.purgeAfter);
    counts.projects++;
  }

  private async trashTaskRecord(tx: Prisma.TransactionClient, task: { id: string; userId: string; lifecycleState: string; archivedAt: Date | null; trashedAt: Date | null; purgeAfter: Date | null }, operationId: string, now: Date, purgeAfter: Date, counts: MutableCounts): Promise<void> {
    await tx.task.update({
      where: { id: task.id },
      data: { lifecycleState: 'TRASHED', trashedAt: now, purgeAfter, currentLifecycleOperationId: operationId, version: { increment: 1 } },
    });
    await this.recordEffect(tx, operationId, task.userId, 'TASK', task.id, task.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED', 'TRASHED', now, task.archivedAt, task.trashedAt, task.purgeAfter);
    counts.tasks++;
  }

  private async trashTasksUnder(tx: Prisma.TransactionClient, userId: string, projectId: string, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    for (const task of await tx.task.findMany({ where: { projectId, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } })) {
      await this.trashTaskRecord(tx, task, operationId, now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000), counts);
      await this.pauseRemindersAndRecurrence(tx, userId, task.id);
    }
  }

  private async trashActiveTasksUnderArea(tx: Prisma.TransactionClient, userId: string, areaId: string, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    for (const task of await tx.task.findMany({ where: { areaId, projectId: null, userId, lifecycleState: { in: ['ACTIVE', 'ARCHIVED'] } } })) {
      await this.trashTaskRecord(tx, task, operationId, now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000), counts);
      await this.pauseRemindersAndRecurrence(tx, userId, task.id);
    }
  }

  private async restoreChildProject(tx: Prisma.TransactionClient, userId: string, project: { id: string; userId: string; lifecycleState: string; archivedAt: Date | null; trashedAt: Date | null; purgeAfter: Date | null; areaId: string }, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    const area = await tx.area.findFirst({ where: { id: project.areaId, userId, lifecycleState: 'ACTIVE' } });
    if (!area) return;
    if (project.lifecycleState !== 'ACTIVE') {
      await tx.project.update({
        where: { id: project.id },
        data: { lifecycleState: 'ACTIVE', archivedAt: null, trashedAt: null, purgeAfter: null, currentLifecycleOperationId: operationId, version: { increment: 1 } },
      });
      await this.recordEffect(tx, operationId, userId, 'PROJECT', project.id, project.lifecycleState as 'ARCHIVED' | 'TRASHED', 'ACTIVE', now, project.archivedAt, project.trashedAt, project.purgeAfter);
      counts.projects++;
    }
  }

  private async restoreTasksByParent(tx: Prisma.TransactionClient, userId: string, parent: { readonly areaId?: string; readonly projectId?: string }, operationId: string, now: Date, counts: MutableCounts): Promise<void> {
    const where: Prisma.TaskWhereInput = { userId, lifecycleState: { in: ['ARCHIVED', 'TRASHED'] } };
    if (parent.projectId) where.projectId = parent.projectId;
    else if (parent.areaId) {
      where.areaId = parent.areaId;
      where.projectId = null;
    }
    const tasks = await tx.task.findMany({ where });
    for (const task of tasks) {
      if (task.lifecycleState !== 'ACTIVE') {
        await tx.task.update({
          where: { id: task.id },
          data: { lifecycleState: 'ACTIVE', archivedAt: null, trashedAt: null, purgeAfter: null, currentLifecycleOperationId: operationId, version: { increment: 1 } },
        });
        await this.recordEffect(tx, operationId, userId, 'TASK', task.id, task.lifecycleState as 'ARCHIVED' | 'TRASHED', 'ACTIVE', now, task.archivedAt, task.trashedAt, task.purgeAfter);
        counts.tasks++;
      }
      await this.pauseRemindersAndRecurrence(tx, userId, task.id);
    }
  }

  private async restoreTaskWithDestination(tx: Prisma.TransactionClient, userId: string, task: { id: string; userId: string; lifecycleState: string; archivedAt: Date | null; trashedAt: Date | null; purgeAfter: Date | null; areaId: string; projectId: string | null; areaStatusId: string }, operationId: string, now: Date, areaId: string, projectId: string | null, counts: MutableCounts): Promise<void> {
    const prev = task.lifecycleState as 'ARCHIVED' | 'TRASHED';

    if (task.areaId !== areaId) {
      const originalStatus = await tx.areaStatus.findFirst({ where: { id: task.areaStatusId, active: true } });
      const canonicalStatus = originalStatus?.canonicalStatus as 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
      const mappedStatus = canonicalStatus
        ? await tx.areaStatus.findFirst({ where: { areaId, canonicalStatus, active: true }, orderBy: { position: 'asc' } })
        : null;
      const defaultStatus = mappedStatus ?? (await tx.areaStatus.findFirst({ where: { areaId, active: true, isDefault: true }, orderBy: { createdAt: 'asc' } }))
        ?? (await tx.areaStatus.findFirst({ where: { areaId, active: true }, orderBy: { position: 'asc' } }));
      if (!defaultStatus) return;

      await tx.task.update({
        where: { id: task.id },
        data: {
          areaId,
          projectId,
          areaStatusId: mappedStatus?.id ?? defaultStatus.id,
          lifecycleState: 'ACTIVE',
          archivedAt: null,
          trashedAt: null,
          purgeAfter: null,
          currentLifecycleOperationId: operationId,
          version: { increment: 1 },
        },
      });
    } else {
      await tx.task.update({
        where: { id: task.id },
        data: { lifecycleState: 'ACTIVE', archivedAt: null, trashedAt: null, purgeAfter: null, currentLifecycleOperationId: operationId, version: { increment: 1 } },
      });
    }

    await this.recordEffect(tx, operationId, userId, 'TASK', task.id, prev, 'ACTIVE', now, task.archivedAt, task.trashedAt, task.purgeAfter, areaId, projectId ?? undefined);
    counts.tasks++;
    await this.pauseRemindersAndRecurrence(tx, userId, task.id);
  }

  private async deleteAreaRecords(tx: Prisma.TransactionClient, userId: string, areaId: string, counts: MutableCounts): Promise<void> {
    const tasks = await tx.task.findMany({ where: { areaId, userId }, select: { id: true } });
    for (const task of tasks) {
      await this.deleteTaskRecords(tx, task.id, counts);
    }
    const projects = await tx.project.findMany({ where: { areaId, userId }, select: { id: true } });
    for (const project of projects) {
      await this.deleteProjectChildren(tx, project.id, counts);
      await tx.project.delete({ where: { id: project.id } });
      counts.projects++;
    }
    await tx.areaStatus.deleteMany({ where: { areaId } });
    await tx.area.delete({ where: { id: areaId } });
  }

  private async deleteProjectRecords(tx: Prisma.TransactionClient, userId: string, projectId: string, counts: MutableCounts): Promise<void> {
    await this.deleteProjectChildren(tx, projectId, counts);
    await tx.project.delete({ where: { id: projectId } });
  }

  private async deleteProjectChildren(tx: Prisma.TransactionClient, projectId: string, counts: MutableCounts): Promise<void> {
    const tasks = await tx.task.findMany({ where: { projectId }, select: { id: true } });
    for (const task of tasks) {
      await this.deleteTaskRecords(tx, task.id, counts);
    }
  }

  private async deleteTaskRecords(tx: Prisma.TransactionClient, taskId: string, counts: MutableCounts): Promise<void> {
    const reminders = await tx.taskReminder.findMany({ where: { taskId }, select: { id: true } });
    for (const reminder of reminders) {
      await tx.notification.deleteMany({ where: { taskReminderId: reminder.id } });
    }
    await tx.taskReminder.deleteMany({ where: { taskId } });
    await tx.checklistItem.deleteMany({ where: { taskId } });
    await tx.taskLabel.deleteMany({ where: { taskId } });
    await tx.task.delete({ where: { id: taskId } });
    counts.tasks++;
  }

  private async pauseRemindersAndRecurrence(tx: Prisma.TransactionClient, userId: string, taskId: string): Promise<void> {
    await tx.taskReminder.updateMany({ where: { taskId, userId, state: 'SCHEDULED' }, data: { state: 'PAUSED', version: { increment: 1 } } });
  }

  private async recordEffect(
    tx: Prisma.TransactionClient,
    operationId: string,
    userId: string,
    affectedKind: LifecycleEntityKind,
    affectedId: string,
    previousState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
    resultingState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
    effectTime: Date,
    previousArchivedAt: Date | null,
    previousTrashedAt: Date | null,
    previousPurgeAfter: Date | null,
    replacementAreaId?: string,
    replacementProjectId?: string,
  ): Promise<void> {
    await tx.lifecycleEffect.create({
      data: {
        userId,
        operationId,
        affectedKind,
        affectedId,
        previousState,
        resultingState,
        effectTime,
        previousArchivedAt,
        previousTrashedAt,
        previousPurgeAfter,
        ...(replacementAreaId !== undefined && { replacementAreaId }),
        ...(replacementProjectId !== undefined && { replacementProjectId }),
      },
    });
  }

  private toEntityKind(kind: LifecycleEntityKind): string {
    return PERMANENT_DELETE_ENTITY_KIND[kind];
  }
}
