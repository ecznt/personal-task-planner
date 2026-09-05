import { Inject, Injectable } from '@nestjs/common';

import { TaskRepository } from '../infrastructure/task.repository';

export type BulkActionItem = {
  readonly taskId: string;
  readonly etag: string;
};

export type StatusChangeCommand = {
  readonly userId: string;
  readonly operation: 'status_change';
  readonly items: readonly BulkActionItem[];
  readonly targetCanonicalStatus?: string;
  readonly targetAreaStatusId?: string;
};

export type LabelChangeCommand = {
  readonly userId: string;
  readonly operation: 'label_change';
  readonly items: readonly BulkActionItem[];
  readonly labelAction: 'add' | 'remove';
  readonly labelIds: readonly string[];
};

export type BulkActionResult = {
  readonly taskId: string;
  readonly success: boolean;
  readonly version?: number;
  readonly etag?: string;
  readonly errorCode?: string;
  readonly errorDetail?: string;
};

@Injectable()
export class BulkActionService {
  constructor(@Inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

  async executeBulkStatusChange(
    command: StatusChangeCommand,
  ): Promise<readonly BulkActionResult[]> {
    if (command.items.length === 0) {
      return [];
    }

    const duplicateIds = findDuplicateIds(command.items);
    if (duplicateIds.length > 0) {
      return command.items.map((item) => ({
        taskId: item.taskId,
        success: false,
        errorCode: 'DUPLICATE_TASK_ID',
        errorDetail: 'Tekrarlanen görev ID.',
      }));
    }

    return this.taskRepository.bulkStatusChange(
      command.userId,
      command.items,
      command.targetCanonicalStatus,
      command.targetAreaStatusId,
    );
  }

  async executeBulkLabelChange(command: LabelChangeCommand): Promise<readonly BulkActionResult[]> {
    if (command.items.length === 0) {
      return [];
    }

    const duplicateIds = findDuplicateIds(command.items);
    if (duplicateIds.length > 0) {
      return command.items.map((item) => ({
        taskId: item.taskId,
        success: false,
        errorCode: 'DUPLICATE_TASK_ID',
        errorDetail: 'Tekrarlanen görev ID.',
      }));
    }

    return this.taskRepository.bulkLabelChange(
      command.userId,
      command.items,
      command.labelAction,
      command.labelIds,
    );
  }
}

function findDuplicateIds(items: readonly BulkActionItem[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of items) {
    if (seen.has(item.taskId)) {
      duplicates.push(item.taskId);
    } else {
      seen.add(item.taskId);
    }
  }

  return duplicates;
}
