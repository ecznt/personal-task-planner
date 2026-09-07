import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type {
  RecurrenceRule,
  RecurrenceSeries,
  RecurrenceSeriesDetail,
} from '../domain/task.entity';

@Injectable()
export class RecurrenceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createSeries(
    userId: string,
    taskId: string,
    rule: {
      readonly mode: 'CALENDAR_BASED' | 'COMPLETION_BASED';
      readonly frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      readonly interval: number;
      readonly selectedWeekdays: readonly number[];
      readonly dayOfMonth: number | null;
      readonly monthOfYear: number | null;
      readonly localTime: string | null;
    },
  ): Promise<RecurrenceSeriesDetail> {
    return this.prisma.$transaction(async (tx) => {
      const ruleVersionId = randomUUID();

      const series = await tx.recurrenceSeries.create({
        data: {
          userId,
          currentOpenTaskId: taskId,
          nextOccurrenceNumber: 2,
          activeRuleVersionId: ruleVersionId,
        },
      });

      const ruleVersion = await tx.recurrenceRuleVersion.create({
        data: {
          id: ruleVersionId,
          userId,
          seriesId: series.id,
          versionNumber: 1,
          mode: rule.mode,
          frequency: rule.frequency,
          interval: rule.interval,
          selectedWeekdays: [...rule.selectedWeekdays],
          dayOfMonth: rule.dayOfMonth,
          monthOfYear: rule.monthOfYear,
          localTime: rule.localTime,
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          recurrenceSeriesId: series.id,
          recurrenceRuleVersionId: ruleVersion.id,
          occurrenceNumber: 1,
        },
      });

      return {
        series: { ...series, activeRuleVersionId: ruleVersion.id },
        activeRule: ruleVersion,
        currentOpenTaskId: taskId,
      };
    });
  }

  async findSeriesDetail(userId: string, taskId: string): Promise<RecurrenceSeriesDetail | null> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      select: { recurrenceSeriesId: true },
    });

    if (!task?.recurrenceSeriesId) {
      return null;
    }

    const series = await this.prisma.recurrenceSeries.findFirst({
      where: { id: task.recurrenceSeriesId, userId },
    });

    if (!series) {
      return null;
    }

    const activeRule = await this.prisma.recurrenceRuleVersion.findFirst({
      where: { id: series.activeRuleVersionId },
    });

    if (!activeRule) {
      return null;
    }

    return {
      series,
      activeRule,
      currentOpenTaskId: series.currentOpenTaskId,
    };
  }

  async stopSeries(userId: string, seriesId: string): Promise<RecurrenceSeries | null> {
    const series = await this.prisma.recurrenceSeries.findFirst({
      where: { id: seriesId, userId },
    });

    if (!series || series.state === 'STOPPED') {
      return null;
    }

    await this.prisma.recurrenceRuleVersion.updateMany({
      where: { seriesId, state: 'ACTIVE' },
      data: { state: 'STOPPED' },
    });

    return this.prisma.recurrenceSeries.update({
      where: { id: seriesId },
      data: { state: 'STOPPED' },
    });
  }

  async findSeriesForCompletion(
    userId: string,
    taskId: string,
  ): Promise<{
    series: RecurrenceSeries;
    activeRule: RecurrenceRule;
    task: {
      id: string;
      areaId: string;
      projectId: string | null;
      title: string;
      description: string | null;
      plannedAt: Date | null;
      dueAt: Date | null;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  } | null> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      select: {
        id: true,
        areaId: true,
        projectId: true,
        title: true,
        description: true,
        plannedAt: true,
        dueAt: true,
        priority: true,
        recurrenceSeriesId: true,
        occurrenceNumber: true,
      },
    });

    if (!task?.recurrenceSeriesId) {
      return null;
    }

    const series = await this.prisma.recurrenceSeries.findFirst({
      where: { id: task.recurrenceSeriesId, userId, state: 'ACTIVE' },
    });

    if (!series) {
      return null;
    }

    if (series.currentOpenTaskId !== taskId) {
      return null;
    }

    const activeRule = await this.prisma.recurrenceRuleVersion.findFirst({
      where: { id: series.activeRuleVersionId, state: 'ACTIVE' },
    });

    if (!activeRule) {
      return null;
    }

    return {
      series,
      activeRule,
      task: {
        id: task.id,
        areaId: task.areaId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        plannedAt: task.plannedAt,
        dueAt: task.dueAt,
        priority: task.priority,
      },
    };
  }

  async generateSuccessor(
    userId: string,
    seriesId: string,
    predecessorTaskId: string,
    generationKey: string,
    successorData: {
      readonly areaId: string;
      readonly projectId: string | null;
      readonly title: string;
      readonly description: string | null;
      readonly plannedAt: Date | null;
      readonly dueAt: Date | null;
      readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
      readonly defaultStatusId: string;
      readonly occurrenceNumber: number;
      readonly ruleVersionId: string;
    },
  ): Promise<{ taskId: string } | null> {
    const existing = await this.prisma.task.findFirst({
      where: { generationKey },
      select: { id: true },
    });

    if (existing) {
      return { taskId: existing.id };
    }

    return this.prisma.$transaction(async (tx) => {
      const maxAreaRank = await tx.task.findFirst({
        where: { userId, areaId: successorData.areaId, lifecycleState: 'ACTIVE' },
        orderBy: { areaRank: 'desc' },
        select: { areaRank: true },
      });

      const nextAreaRank = maxAreaRank
        ? incrementRank(maxAreaRank.areaRank)
        : '000000000000000000000001';

      const maxGlobalRank = await tx.task.findFirst({
        where: { userId, lifecycleState: 'ACTIVE' },
        orderBy: { globalRank: 'desc' },
        select: { globalRank: true },
      });

      const nextGlobalRank = maxGlobalRank
        ? incrementRank(maxGlobalRank.globalRank)
        : '000000000000000000000001';

      const successor = await tx.task.create({
        data: {
          userId,
          areaId: successorData.areaId,
          projectId: successorData.projectId,
          areaStatusId: successorData.defaultStatusId,
          title: successorData.title,
          description: successorData.description,
          plannedAt: successorData.plannedAt,
          dueAt: successorData.dueAt,
          priority: successorData.priority,
          globalRank: nextGlobalRank,
          areaRank: nextAreaRank,
          recurrenceSeriesId: seriesId,
          recurrenceRuleVersionId: successorData.ruleVersionId,
          occurrenceNumber: successorData.occurrenceNumber,
          predecessorTaskId,
          generationKey,
        },
      });

      await tx.recurrenceSeries.update({
        where: { id: seriesId },
        data: {
          currentOpenTaskId: successor.id,
          lastCompletedTaskId: predecessorTaskId,
          nextOccurrenceNumber: successorData.occurrenceNumber + 1,
        },
      });

      return { taskId: successor.id };
    });
  }

  async getLabels(userId: string, taskId: string): Promise<readonly string[]> {
    const labels = await this.prisma.taskLabel.findMany({
      where: { taskId, userId },
      select: { labelId: true },
    });
    return labels.map((l) => l.labelId);
  }

  async copyLabels(userId: string, sourceTaskId: string, targetTaskId: string): Promise<void> {
    const labels = await this.getLabels(userId, sourceTaskId);
    if (labels.length === 0) return;

    await this.prisma.taskLabel.createMany({
      data: labels.map((labelId) => ({
        userId,
        taskId: targetTaskId,
        labelId,
      })),
    });
  }

  async copyChecklist(userId: string, sourceTaskId: string, targetTaskId: string): Promise<void> {
    const items = await this.prisma.checklistItem.findMany({
      where: { taskId: sourceTaskId, userId },
      orderBy: { position: 'asc' },
      select: { text: true, position: true },
    });

    if (items.length === 0) return;

    await this.prisma.checklistItem.createMany({
      data: items.map((item) => ({
        userId,
        taskId: targetTaskId,
        text: item.text,
        position: item.position,
      })),
    });
  }
}

function incrementRank(rank: string): string {
  const num = BigInt(rank) + 1000n;
  return num.toString().padStart(24, '0');
}
