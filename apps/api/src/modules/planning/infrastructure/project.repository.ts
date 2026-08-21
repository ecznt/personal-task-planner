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
        _count: {
          select: {
            tasks: {
              where: { lifecycleState: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!project) return null;

    return {
      id: project.id,
      areaId: project.areaId,
      name: project.name,
      lifecycleState: project.lifecycleState,
      version: project.version,
      taskCount: project._count.tasks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async listByArea(
    userId: string,
    areaId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ projects: ProjectSummary[]; nextCursor?: string }> {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        areaId,
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
        _count: {
          select: {
            tasks: {
              where: { lifecycleState: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      projects: items.map((p: (typeof items)[number]) => ({
        id: p.id,
        areaId: p.areaId,
        name: p.name,
        lifecycleState: p.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
        version: p.version,
        taskCount: p._count.tasks,
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
}

function normalizeProjectName(name: string): string {
  return name.trim().normalize('NFKC').toLocaleLowerCase('tr-TR');
}
