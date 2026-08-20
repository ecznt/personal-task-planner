import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { ChecklistItem } from '../domain/checklist-item.entity';

@Injectable()
export class ChecklistItemRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createItem(
    userId: string,
    taskId: string,
    text: string,
    position: number,
  ): Promise<ChecklistItem> {
    return this.prisma.checklistItem.create({
      data: { userId, taskId, text, position },
    });
  }

  async findById(
    userId: string,
    taskId: string,
    checklistItemId: string,
  ): Promise<ChecklistItem | null> {
    return this.prisma.checklistItem.findFirst({
      where: { id: checklistItemId, taskId, userId },
    });
  }

  async listByTask(userId: string, taskId: string): Promise<readonly ChecklistItem[]> {
    return this.prisma.checklistItem.findMany({
      where: { taskId, userId },
      orderBy: { position: 'asc' },
    });
  }

  async updateText(
    userId: string,
    taskId: string,
    checklistItemId: string,
    text: string,
  ): Promise<ChecklistItem | null> {
    const result = await this.prisma.checklistItem.updateMany({
      where: { id: checklistItemId, taskId, userId },
      data: { text },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.checklistItem.findUnique({ where: { id: checklistItemId } });
  }

  async complete(
    userId: string,
    taskId: string,
    checklistItemId: string,
    completedAt: Date,
  ): Promise<ChecklistItem | null> {
    const result = await this.prisma.checklistItem.updateMany({
      where: { id: checklistItemId, taskId, userId, completedAt: null },
      data: { completedAt },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.checklistItem.findUnique({ where: { id: checklistItemId } });
  }

  async reopen(
    userId: string,
    taskId: string,
    checklistItemId: string,
  ): Promise<ChecklistItem | null> {
    const result = await this.prisma.checklistItem.updateMany({
      where: { id: checklistItemId, taskId, userId, completedAt: { not: null } },
      data: { completedAt: null },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.checklistItem.findUnique({ where: { id: checklistItemId } });
  }

  async delete(userId: string, taskId: string, checklistItemId: string): Promise<boolean> {
    const result = await this.prisma.checklistItem.deleteMany({
      where: { id: checklistItemId, taskId, userId },
    });

    return result.count > 0;
  }

  async getMaxPosition(userId: string, taskId: string): Promise<number> {
    const max = await this.prisma.checklistItem.findFirst({
      where: { taskId, userId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return max?.position ?? 0;
  }

  async reorder(userId: string, taskId: string, orderedIds: readonly string[]): Promise<boolean> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const items = await transaction.checklistItem.findMany({
        where: { taskId, userId },
        select: { id: true },
      });

      const itemIds = new Set(items.map((item) => item.id));

      for (const id of orderedIds) {
        if (!itemIds.has(id)) {
          return false;
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (id !== undefined) {
          await transaction.checklistItem.update({
            where: { id },
            data: { position: i + 1 },
          });
        }
      }

      return true;
    });

    return result;
  }
}
