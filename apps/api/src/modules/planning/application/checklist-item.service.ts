import { Inject, Injectable } from '@nestjs/common';

import { ChecklistItemRepository } from '../infrastructure/checklist-item.repository';
import { TaskRepository } from '../infrastructure/task.repository';
import type { ChecklistItem } from '../domain/checklist-item.entity';

export type AddChecklistItemCommand = {
  readonly taskId: string;
  readonly text: string;
  readonly version: number;
};

export type AddChecklistItemResult =
  | { readonly outcome: 'SUCCESS'; readonly item: ChecklistItem; readonly taskVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type EditChecklistItemCommand = {
  readonly taskId: string;
  readonly checklistItemId: string;
  readonly text: string;
  readonly version: number;
};

export type EditChecklistItemResult =
  | { readonly outcome: 'SUCCESS'; readonly item: ChecklistItem; readonly taskVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type CompleteChecklistItemCommand = {
  readonly taskId: string;
  readonly checklistItemId: string;
  readonly version: number;
};

export type CompleteChecklistItemResult =
  | { readonly outcome: 'SUCCESS'; readonly item: ChecklistItem; readonly taskVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ReopenChecklistItemCommand = {
  readonly taskId: string;
  readonly checklistItemId: string;
  readonly version: number;
};

export type ReopenChecklistItemResult =
  | { readonly outcome: 'SUCCESS'; readonly item: ChecklistItem; readonly taskVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type DeleteChecklistItemCommand = {
  readonly taskId: string;
  readonly checklistItemId: string;
  readonly version: number;
};

export type DeleteChecklistItemResult =
  | { readonly outcome: 'SUCCESS'; readonly taskVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ListChecklistItemsQuery = {
  readonly taskId: string;
};

export type ListChecklistItemsResult =
  | { readonly outcome: 'SUCCESS'; readonly items: readonly ChecklistItem[] }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ReorderChecklistCommand = {
  readonly taskId: string;
  readonly orderedIds: readonly string[];
  readonly version: number;
};

export type ReorderChecklistResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly items: readonly ChecklistItem[];
      readonly taskVersion: number;
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

@Injectable()
export class ChecklistItemService {
  constructor(
    @Inject(ChecklistItemRepository) private readonly checklistRepository: ChecklistItemRepository,
    @Inject(TaskRepository) private readonly taskRepository: TaskRepository,
  ) {}

  async addChecklistItem(
    userId: string,
    command: AddChecklistItemCommand,
  ): Promise<AddChecklistItemResult> {
    const text = command.text.trim();

    if (text.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Madde metni boş olamaz.' };
    }

    if (text.length > 1000) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Madde metni 1000 karakterden uzun olamaz.' };
    }

    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    const maxPosition = await this.checklistRepository.getMaxPosition(userId, command.taskId);
    const item = await this.checklistRepository.createItem(
      userId,
      command.taskId,
      text,
      maxPosition + 1,
    );

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);

    return { outcome: 'SUCCESS', item, taskVersion: updatedTask?.version ?? command.version + 1 };
  }

  async editChecklistItem(
    userId: string,
    command: EditChecklistItemCommand,
  ): Promise<EditChecklistItemResult> {
    const text = command.text.trim();

    if (text.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Madde metni boş olamaz.' };
    }

    if (text.length > 1000) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Madde metni 1000 karakterden uzun olamaz.' };
    }

    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    const item = await this.checklistRepository.updateText(
      userId,
      command.taskId,
      command.checklistItemId,
      text,
    );

    if (!item) {
      return { outcome: 'NOT_FOUND' };
    }

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);

    return { outcome: 'SUCCESS', item, taskVersion: updatedTask?.version ?? command.version + 1 };
  }

  async completeChecklistItem(
    userId: string,
    command: CompleteChecklistItemCommand,
  ): Promise<CompleteChecklistItemResult> {
    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    const item = await this.checklistRepository.complete(
      userId,
      command.taskId,
      command.checklistItemId,
      new Date(),
    );

    if (!item) {
      return { outcome: 'NOT_FOUND' };
    }

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);

    return { outcome: 'SUCCESS', item, taskVersion: updatedTask?.version ?? command.version + 1 };
  }

  async reopenChecklistItem(
    userId: string,
    command: ReopenChecklistItemCommand,
  ): Promise<ReopenChecklistItemResult> {
    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    const item = await this.checklistRepository.reopen(
      userId,
      command.taskId,
      command.checklistItemId,
    );

    if (!item) {
      return { outcome: 'NOT_FOUND' };
    }

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);

    return { outcome: 'SUCCESS', item, taskVersion: updatedTask?.version ?? command.version + 1 };
  }

  async deleteChecklistItem(
    userId: string,
    command: DeleteChecklistItemCommand,
  ): Promise<DeleteChecklistItemResult> {
    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    const deleted = await this.checklistRepository.delete(
      userId,
      command.taskId,
      command.checklistItemId,
    );

    if (!deleted) {
      return { outcome: 'NOT_FOUND' };
    }

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);

    return { outcome: 'SUCCESS', taskVersion: updatedTask?.version ?? command.version + 1 };
  }

  async listChecklistItems(
    userId: string,
    query: ListChecklistItemsQuery,
  ): Promise<ListChecklistItemsResult> {
    const task = await this.taskRepository.findById(userId, query.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    const items = await this.checklistRepository.listByTask(userId, query.taskId);

    return { outcome: 'SUCCESS', items };
  }

  async reorderChecklist(
    userId: string,
    command: ReorderChecklistCommand,
  ): Promise<ReorderChecklistResult> {
    const task = await this.taskRepository.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.task.version !== command.version) {
      return { outcome: 'STALE_VERSION' };
    }

    if (command.orderedIds.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Sıralama listesi boş olamaz.' };
    }

    const reordered = await this.checklistRepository.reorder(
      userId,
      command.taskId,
      command.orderedIds,
    );

    if (!reordered) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Geçersiz madde listesi.' };
    }

    const updatedTask = await this.taskRepository.incrementVersion(userId, command.taskId);
    const items = await this.checklistRepository.listByTask(userId, command.taskId);

    return {
      outcome: 'SUCCESS',
      items,
      taskVersion: updatedTask?.version ?? command.version + 1,
    };
  }
}
