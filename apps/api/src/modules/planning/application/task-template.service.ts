import { Inject, Injectable } from '@nestjs/common';

import type { TaskTemplate, TaskTemplateSummary } from '../domain/task-template.entity';
import { LabelRepository } from '../infrastructure/label.repository';
import { TaskTemplateRepository } from '../infrastructure/task-template.repository';
import { TaskService, type CreateTaskCommand, type CreateTaskResult } from './task.service';

export type CreateTaskTemplateCommand = {
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays: number | null;
};

export type CreateTaskTemplateResult =
  | { readonly outcome: 'SUCCESS'; readonly template: TaskTemplate; readonly etag: number }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string };

export type UpdateTaskTemplateCommand = {
  readonly templateId: string;
  readonly version: number;
  readonly title?: string;
  readonly description?: string | null;
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps?: readonly string[];
  readonly labelNames?: readonly string[];
  readonly defaultPlannedAtOffsetDays?: number | null;
};

export type UpdateTaskTemplateResult =
  | { readonly outcome: 'SUCCESS'; readonly template: TaskTemplate; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string };

export type DeleteTaskTemplateResult =
  | { readonly outcome: 'SUCCESS' }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' };

export type ListTaskTemplatesResult = {
  readonly outcome: 'SUCCESS';
  readonly templates: readonly TaskTemplateSummary[];
  readonly nextCursor?: string;
};

export type GetTaskTemplateResult =
  | { readonly outcome: 'SUCCESS'; readonly template: TaskTemplate; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' };

export type ApplyTaskTemplateCommand = {
  readonly templateId: string;
  readonly areaId?: string;
  readonly projectId?: string | null;
  readonly plannedAt?: string | null;
};

export type ApplyTaskTemplateResult = CreateTaskResult | { readonly outcome: 'NOT_FOUND' };

@Injectable()
export class TaskTemplateService {
  constructor(
    @Inject(TaskTemplateRepository) private readonly templates: TaskTemplateRepository,
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(LabelRepository) private readonly labels: LabelRepository,
  ) {}

  async createTemplate(
    userId: string,
    command: CreateTaskTemplateCommand,
  ): Promise<CreateTaskTemplateResult> {
    const title = command.title.trim();

    if (title.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Şablon adı boş olamaz.' };
    }

    if (title.length > 200) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Şablon adı en fazla 200 karakter olabilir.' };
    }

    if (command.description !== null && command.description !== undefined) {
      if (command.description.length > 5000) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Açıklama en fazla 5000 karakter olabilir.',
        };
      }
    }

    if (command.checklistSteps.some((step) => step.length === 0)) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Boş kontrol listesi adımı eklenemez.',
      };
    }

    const template = await this.templates.create(userId, {
      title,
      description: command.description,
      priority: command.priority,
      checklistSteps: command.checklistSteps,
      labelNames: command.labelNames,
      defaultPlannedAtOffsetDays: command.defaultPlannedAtOffsetDays,
    });

    return { outcome: 'SUCCESS', template, etag: template.version };
  }

  async listTemplates(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<ListTaskTemplatesResult> {
    const result = await this.templates.list(userId, cursor, limit);

    return {
      outcome: 'SUCCESS',
      templates: result.templates,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }

  async getTemplate(
    userId: string,
    templateId: string,
  ): Promise<GetTaskTemplateResult> {
    const template = await this.templates.findById(userId, templateId);

    if (!template) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'SUCCESS', template, etag: template.version };
  }

  async updateTemplate(
    userId: string,
    command: UpdateTaskTemplateCommand,
  ): Promise<UpdateTaskTemplateResult> {
    if (command.title !== undefined && command.title.trim().length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Şablon adı boş olamaz.' };
    }

    if (command.title !== undefined && command.title.length > 200) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Şablon adı en fazla 200 karakter olabilir.' };
    }

    const template = await this.templates.update(userId, command.templateId, command.version, {
      ...(command.title !== undefined && { title: command.title.trim() }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.priority !== undefined && { priority: command.priority }),
      ...(command.checklistSteps !== undefined && { checklistSteps: command.checklistSteps }),
      ...(command.labelNames !== undefined && { labelNames: command.labelNames }),
      ...(command.defaultPlannedAtOffsetDays !== undefined && {
        defaultPlannedAtOffsetDays: command.defaultPlannedAtOffsetDays,
      }),
    });

    if (!template) {
      const recheck = await this.templates.findById(userId, command.templateId);
      if (!recheck) {
        return { outcome: 'NOT_FOUND' };
      }
      return { outcome: 'STALE_VERSION' };
    }

    return { outcome: 'SUCCESS', template, etag: template.version };
  }

  async deleteTemplate(
    userId: string,
    templateId: string,
    version: number,
  ): Promise<DeleteTaskTemplateResult> {
    const deleted = await this.templates.delete(userId, templateId, version);

    if (deleted) {
      return { outcome: 'SUCCESS' };
    }

    const existing = await this.templates.findVersion(userId, templateId);
    if (existing === null) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'STALE_VERSION' };
  }

  async applyTemplate(
    userId: string,
    command: ApplyTaskTemplateCommand,
  ): Promise<ApplyTaskTemplateResult> {
    const template = await this.templates.findById(userId, command.templateId);

    if (!template) {
      return { outcome: 'NOT_FOUND' };
    }

    let plannedAt: Date | null = null;

    if (command.plannedAt !== undefined && command.plannedAt !== null) {
      plannedAt = new Date(command.plannedAt);
    } else if (template.defaultPlannedAtOffsetDays !== null) {
      plannedAt = new Date();
      plannedAt.setDate(plannedAt.getDate() + template.defaultPlannedAtOffsetDays);
    }

    const labelIds = await this.resolveLabelIds(userId, template.labelNames);

    const createCommand: CreateTaskCommand = {
      title: template.title,
      description: template.description,
      priority: template.priority,
      plannedAt,
      dueAt: null,
      ...(labelIds.length > 0 && { labelIds }),
      ...(template.checklistSteps.length > 0 && {
        checklistItems: template.checklistSteps.map((text) => ({ text })),
      }),
      ...(command.areaId !== undefined && { areaId: command.areaId }),
      ...(command.projectId !== undefined && { projectId: command.projectId }),
    };

    const result = await this.taskService.createTask(userId, createCommand);

    return result;
  }

  private async resolveLabelIds(
    userId: string,
    labelNames: readonly string[],
  ): Promise<string[]> {
    if (labelNames.length === 0) {
      return [];
    }

    const normalized = labelNames.map((name) => name.normalize('NFKC').toLocaleLowerCase('tr-TR'));
    const labels = await this.labels.findManyByNames(userId, normalized);

    return labels.map((label) => label.id);
  }
}