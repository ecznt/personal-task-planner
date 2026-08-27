import { Inject, Injectable } from '@nestjs/common';

import { TaskRepository } from '../infrastructure/task.repository';
import type { TaskSummary } from '../domain/task.entity';

export type SearchTasksQuery = {
  readonly userId: string;
  readonly q: string;
  readonly cursor?: string;
  readonly limit: number;
  readonly sort: string;
  readonly order: 'asc' | 'desc';
  readonly areaId?: string;
  readonly projectId?: string;
  readonly priority?: string;
  readonly canonicalStatus?: string;
  readonly labelId?: string;
};

export type SearchResult = TaskSummary & {
  readonly descriptionSnippet: string | null;
  readonly score: number;
};

export type SearchTasksResult = {
  readonly outcome: 'SUCCESS';
  readonly data: readonly SearchResult[];
  readonly nextCursor?: string;
  readonly hasMore: boolean;
};

@Injectable()
export class SearchService {
  constructor(@Inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

  async searchTasks(query: SearchTasksQuery): Promise<SearchTasksResult> {
    const result = await this.taskRepository.searchTasks(query.userId, query.q, {
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.areaId !== undefined && { areaId: query.areaId }),
      ...(query.projectId !== undefined && { projectId: query.projectId }),
      ...(query.priority !== undefined && { priority: query.priority }),
      ...(query.canonicalStatus !== undefined && { canonicalStatus: query.canonicalStatus }),
      ...(query.labelId !== undefined && { labelId: query.labelId }),
    });

    return {
      outcome: 'SUCCESS',
      data: result.tasks,
      hasMore: result.nextCursor !== undefined,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }
}
