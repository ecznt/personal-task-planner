import { Inject, Injectable } from '@nestjs/common';

import { TaskRepository } from '../infrastructure/task.repository';
import type { DateStateValue, TaskSummary } from '../domain/task.entity';
import { parseTodayRange } from './date-range';

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
  readonly dateState?: DateStateValue;
  readonly timezone?: string;
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
    const range =
      query.dateState !== undefined
        ? parseTodayRange(query.timezone ?? 'Europe/Istanbul')
        : undefined;

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
      ...(query.dateState !== undefined &&
        range !== undefined && {
          dateState: query.dateState,
          todayStart: range.todayStart,
          todayEnd: range.todayEnd,
        }),
    });

    return {
      outcome: 'SUCCESS',
      data: result.tasks,
      hasMore: result.nextCursor !== undefined,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }
}
