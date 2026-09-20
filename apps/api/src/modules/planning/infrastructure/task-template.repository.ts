import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { TaskTemplate, TaskTemplateSummary } from '../domain/task-template.entity';

export type CreateTaskTemplateData = {
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays: number | null;
};

export type UpdateTaskTemplateData = Partial<CreateTaskTemplateData>;

@Injectable()
export class TaskTemplateRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateTaskTemplateData): Promise<TaskTemplate> {
    return this.prisma.taskTemplate.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        checklistSteps: data.checklistSteps as string[],
        labelNames: data.labelNames as string[],
        defaultPlannedAtOffsetDays: data.defaultPlannedAtOffsetDays,
      },
    });
  }

  async findById(userId: string, templateId: string): Promise<TaskTemplate | null> {
    return this.prisma.taskTemplate.findFirst({ where: { id: templateId, userId } });
  }

  async findVersion(userId: string, templateId: string): Promise<number | null> {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id: templateId, userId },
      select: { version: true },
    });

    return template?.version ?? null;
  }

  async list(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ templates: readonly TaskTemplateSummary[]; nextCursor?: string }> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
      ...(cursor !== undefined && { cursor: { id: cursor } }),
    });

    const hasMore = templates.length > limit;
    const lastFetched = hasMore ? templates.at(limit) : undefined;
    const nextCursor = lastFetched?.id;
    const sliced = templates.slice(0, limit);

    return {
      templates: sliced.map(toSummary),
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async update(
    userId: string,
    templateId: string,
    version: number,
    data: UpdateTaskTemplateData,
  ): Promise<TaskTemplate | null> {
    const result = await this.prisma.taskTemplate.updateMany({
      where: { id: templateId, userId, version },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.checklistSteps !== undefined && {
          checklistSteps: data.checklistSteps as string[],
        }),
        ...(data.labelNames !== undefined && { labelNames: data.labelNames as string[] }),
        ...(data.defaultPlannedAtOffsetDays !== undefined && {
          defaultPlannedAtOffsetDays: data.defaultPlannedAtOffsetDays,
        }),
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.taskTemplate.findFirst({ where: { id: templateId, userId } });
  }

  async delete(userId: string, templateId: string, version: number): Promise<boolean> {
    const result = await this.prisma.taskTemplate.deleteMany({
      where: { id: templateId, userId, version },
    });

    return result.count > 0;
  }
}

function toSummary(template: TaskTemplate): TaskTemplateSummary {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    priority: template.priority,
    checklistSteps: template.checklistSteps,
    labelNames: template.labelNames,
    defaultPlannedAtOffsetDays: template.defaultPlannedAtOffsetDays,
    version: template.version,
    updatedAt: template.updatedAt,
  };
}