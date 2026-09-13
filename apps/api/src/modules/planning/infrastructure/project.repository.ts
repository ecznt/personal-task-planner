import { Injectable, Inject } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Project, ProjectSummary, ProjectDetail } from '../domain/project.entity';

@Injectable()
export class ProjectRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createProject(userId: string, areaId: string, name: string): Promise<Project> {
    const normalizedName = normalizeProjectName(name);

    const project = await this.prisma.project.create({
      data: {
        userId,
        areaId,
        name: name.trim(),
        normalizedName,
      },
      select: {
        id: true,
        userId: true,
        areaId: true,
        name: true,
        normalizedName: true,
        lifecycleState: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: project.id,
      userId: project.userId,
      areaId: project.areaId,
      name: project.name,
      normalizedName: project.normalizedName,
      lifecycleState: project.lifecycleState,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async findById(userId: string, projectId: string): Promise<ProjectDetail | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        lifecycleState: 'ACTIVE',
      },
      select: {
        id: true,
        areaId: true,
        name: true,
        lifecycleState: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) return null;

    const counts = await this.taskCounts(projectId);

    return {
      id: project.id,
      areaId: project.areaId,
      name: project.name,
      lifecycleState: project.lifecycleState,
      version: project.version,
      taskCount: counts.taskCount,
      completedTaskCount: counts.completedTaskCount,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async listProjects(
    userId: string,
    areaId?: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ projects: ProjectSummary[]; nextCursor?: string }> {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        ...(areaId !== undefined && { areaId }),
        lifecycleState: 'ACTIVE',
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      select: {
        id: true,
        areaId: true,
        name: true,
        lifecycleState: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ areaId: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    const counts = await this.taskCountsByProject(items.map((p) => p.id));

    return {
      projects: items.map((p) => ({
        id: p.id,
        areaId: p.areaId,
        name: p.name,
        lifecycleState: p.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
        version: p.version,
        taskCount: counts.get(p.id)?.taskCount ?? 0,
        completedTaskCount: counts.get(p.id)?.completedTaskCount ?? 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async updateName(
    userId: string,
    projectId: string,
    name: string,
    version: number,
  ): Promise<Project | null> {
    const normalizedName = normalizeProjectName(name);

    const result = await this.prisma.project.updateMany({
      where: {
        id: projectId,
        userId,
        version,
        lifecycleState: 'ACTIVE',
      },
      data: {
        name: name.trim(),
        normalizedName,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) return null;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        userId: true,
        areaId: true,
        name: true,
        normalizedName: true,
        lifecycleState: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) return null;

    return {
      id: project.id,
      userId: project.userId,
      areaId: project.areaId,
      name: project.name,
      normalizedName: project.normalizedName,
      lifecycleState: project.lifecycleState,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async findByNormalized(
    userId: string,
    areaId: string,
    normalizedName: string,
  ): Promise<{ id: string } | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        userId,
        areaId,
        normalizedName,
        lifecycleState: 'ACTIVE',
      },
      select: { id: true },
    });

    return project ?? null;
  }

  async projectExists(userId: string, projectId: string): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: {
        id: projectId,
        userId,
        lifecycleState: 'ACTIVE',
      },
    });
    return count > 0;
  }

  async projectBelongsToArea(userId: string, projectId: string, areaId: string): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: {
        id: projectId,
        userId,
        areaId,
        lifecycleState: 'ACTIVE',
      },
    });
    return count > 0;
  }

  async moveProjectToArea(
    userId: string,
    projectId: string,
    targetAreaId: string,
    version: number,
  ): Promise<
    | { readonly outcome: 'SUCCESS'; readonly project: Project; readonly movedTasks: number }
    | { readonly outcome: 'NOT_FOUND' }
    | { readonly outcome: 'STALE_VERSION' }
    | { readonly outcome: 'NO_DEFAULT_STATUS' }
  > {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: projectId, userId, version, lifecycleState: 'ACTIVE' },
        select: { id: true },
      });

      if (!project) {
        const exists = await tx.project.findFirst({
          where: { id: projectId, userId, lifecycleState: 'ACTIVE' },
          select: { id: true },
        });

        return exists ? { outcome: 'STALE_VERSION' } : { outcome: 'NOT_FOUND' };
      }

      const targetArea = await tx.area.findFirst({
        where: { id: targetAreaId, userId, lifecycleState: 'ACTIVE' },
        select: { id: true },
      });

      if (!targetArea) {
        return { outcome: 'NOT_FOUND' };
      }

      const tasks = await tx.task.findMany({
        where: { projectId, userId },
        select: {
          id: true,
          lifecycleState: true,
          areaStatus: { select: { canonicalStatus: true } },
        },
      });

      const defaults = await tx.areaStatus.findMany({
        where: { userId, areaId: targetAreaId, active: true, isDefault: true },
        select: { id: true, canonicalStatus: true },
      });

      const defaultByGroup = new Map(defaults.map((d) => [d.canonicalStatus, d.id]));
      const groupsNeeded = new Set(
        tasks.map((t) => t.areaStatus?.canonicalStatus ?? 'TO_DO'),
      );

      for (const group of groupsNeeded) {
        if (!defaultByGroup.has(group)) {
          return { outcome: 'NO_DEFAULT_STATUS' };
        }
      }

      const activeTasks = tasks.filter((t) => t.lifecycleState === 'ACTIVE');

      for (const group of groupsNeeded) {
        const groupTasks = activeTasks.filter(
          (t) => (t.areaStatus?.canonicalStatus ?? 'TO_DO') === group,
        );

        if (groupTasks.length === 0) continue;

        const defaultStatusId = defaultByGroup.get(group);

        if (!defaultStatusId) {
          return { outcome: 'NO_DEFAULT_STATUS' };
        }

        const maxGlobalRank = await tx.task.findFirst({
          where: {
            userId,
            lifecycleState: 'ACTIVE',
            areaStatus: { canonicalStatus: group },
          },
          orderBy: { globalRank: 'desc' },
          select: { globalRank: true },
        });

        let rank = maxGlobalRank
          ? incrementRank(maxGlobalRank.globalRank)
          : '000000000000000000000001';

        for (const task of groupTasks) {
          await tx.task.updateMany({
            where: { id: task.id, userId },
            data: {
              areaId: targetAreaId,
              areaStatusId: defaultStatusId,
              globalRank: rank,
              version: { increment: 1 },
            },
          });

          rank = incrementRank(rank);
        }
      }

      for (const task of tasks.filter((t) => t.lifecycleState !== 'ACTIVE')) {
        const group = task.areaStatus?.canonicalStatus ?? 'TO_DO';
        const defaultStatusId = defaultByGroup.get(group);

        if (!defaultStatusId) {
          return { outcome: 'NO_DEFAULT_STATUS' };
        }

        await tx.task.updateMany({
          where: { id: task.id, userId },
          data: {
            areaId: targetAreaId,
            areaStatusId: defaultStatusId,
            version: { increment: 1 },
          },
        });
      }

      const updated = await tx.project.update({
        where: { id: projectId },
        data: { areaId: targetAreaId, version: { increment: 1 } },
        select: {
          id: true,
          userId: true,
          areaId: true,
          name: true,
          normalizedName: true,
          lifecycleState: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        outcome: 'SUCCESS',
        project: {
          id: updated.id,
          userId: updated.userId,
          areaId: updated.areaId,
          name: updated.name,
          normalizedName: updated.normalizedName,
          lifecycleState: updated.lifecycleState,
          version: updated.version,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
        movedTasks: tasks.length,
      };
    });
  }

  private async taskCounts(projectId: string): Promise<{ taskCount: number; completedTaskCount: number }> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId, lifecycleState: 'ACTIVE' },
      select: { id: true, areaStatus: { select: { canonicalStatus: true } } },
    });

    let completed = 0;

    for (const task of tasks) {
      if (task.areaStatus?.canonicalStatus === 'COMPLETED') {
        completed += 1;
      }
    }

    return { taskCount: tasks.length, completedTaskCount: completed };
  }

  private async taskCountsByProject(
    projectIds: string[],
  ): Promise<Map<string, { taskCount: number; completedTaskCount: number }>> {
    const result = new Map<string, { taskCount: number; completedTaskCount: number }>();

    if (projectIds.length === 0) {
      return result;
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId: { in: projectIds }, lifecycleState: 'ACTIVE' },
      select: {
        projectId: true,
        areaStatus: { select: { canonicalStatus: true } },
      },
    });

    for (const task of tasks) {
      if (!task.projectId) continue;

      const entry = result.get(task.projectId) ?? { taskCount: 0, completedTaskCount: 0 };

      entry.taskCount += 1;

      if (task.areaStatus?.canonicalStatus === 'COMPLETED') {
        entry.completedTaskCount += 1;
      }

      result.set(task.projectId, entry);
    }

    for (const id of projectIds) {
      if (!result.has(id)) {
        result.set(id, { taskCount: 0, completedTaskCount: 0 });
      }
    }

    return result;
  }
}

function incrementRank(rank: string): string {
  return (BigInt(rank) + 1000n).toString().padStart(24, '0');
}

function normalizeProjectName(name: string): string {
  return name.trim().normalize('NFKC').toLocaleLowerCase('tr-TR');
}
