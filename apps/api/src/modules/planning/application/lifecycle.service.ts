import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Prisma } from '../../../platform/database/generated/client/client';
import type {
  LifecycleCascadeCounts,
  LifecycleEntityKind,
  LifecycleManagedNode,
  LifecycleOperationKind,
  LifecycleOperationSummary,
} from '../domain/lifecycle.entity';
import { LifecycleRepository } from '../infrastructure/lifecycle.repository';

export type LifecycleCommandResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly data: {
        readonly id: string;
        readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
        readonly version: number;
        readonly affected: LifecycleCascadeCounts;
        readonly operationId: string;
        readonly purgeAfter: string | null;
      };
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'INVALID_STATE'; readonly detail: string }
  | { readonly outcome: 'DESTINATION_UNAVAILABLE'; readonly detail: string };

export type LifecycleListResult = {
  readonly outcome: 'SUCCESS';
  readonly data: {
    readonly entries: LifecycleManagedNode[];
    readonly nextCursor: string | undefined;
  };
};

export type LifecycleDetailResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly data: {
        readonly node: LifecycleManagedNode;
        readonly cascadePreview: readonly LifecycleManagedNode[];
        readonly etag: number;
      };
    }
  | { readonly outcome: 'NOT_FOUND' };

@Injectable()
export class LifecycleService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(LifecycleRepository) private readonly repository: LifecycleRepository,
  ) {}

  async list(
    userId: string,
    state: 'ARCHIVED' | 'TRASHED',
    cursor: string | undefined,
    limit: number,
  ): Promise<LifecycleListResult> {
    const result = await this.repository.listLifecycleEntries(userId, state, cursor, limit);
    return {
      outcome: 'SUCCESS',
      data: {
        entries: result.entries.map((e) => ({
          kind: e.projectId ? 'TASK' : e.areaId ? 'PROJECT' : 'AREA',
          id: e.id,
          name: e.name,
          lifecycleState: e.lifecycleState,
          areaId: e.areaId,
          projectId: e.projectId,
          archivedAt: e.archivedAt,
          trashedAt: e.trashedAt,
          purgeAfter: e.purgeAfter,
          version: e.version,
        })) as LifecycleManagedNode[],
        nextCursor: result.nextCursor,
      },
    };
  }

  async detail(
    userId: string,
    kind: LifecycleEntityKind,
    id: string,
  ): Promise<LifecycleDetailResult> {
    const node = await this.repository.findOrigin(userId, kind, id);
    if (!node || node.lifecycleState === 'ACTIVE') {
      return { outcome: 'NOT_FOUND' };
    }

    const cascadePreview = await this.collectCascadePreview(userId, kind, id);

    return {
      outcome: 'SUCCESS',
      data: { node, cascadePreview, etag: node.version },
    };
  }

  async archive(
    userId: string,
    command: {
      readonly kind: LifecycleEntityKind;
      readonly id: string;
      readonly version: number;
      readonly confirmCascade: boolean;
    },
  ): Promise<LifecycleCommandResult> {
    return this.runScopedOperation(userId, 'ARCHIVE', command, async (tx, operationId, now) => {
      const result = await this.repository.archive(
        tx,
        userId,
        command.id,
        command.kind,
        operationId,
        now,
      );
      return result.affected;
    });
  }

  async trash(
    userId: string,
    command: {
      readonly kind: LifecycleEntityKind;
      readonly id: string;
      readonly version: number;
      readonly confirmCascade: boolean;
    },
  ): Promise<LifecycleCommandResult> {
    return this.runScopedOperation(userId, 'TRASH', command, async (tx, operationId, now) => {
      const result = await this.repository.trash(
        tx,
        userId,
        command.id,
        command.kind,
        operationId,
        now,
      );
      return result.affected;
    });
  }

  async restore(
    userId: string,
    command: {
      readonly kind: LifecycleEntityKind;
      readonly id: string;
      readonly version: number;
      readonly replacementAreaId?: string;
      readonly replacementProjectId?: string;
    },
  ): Promise<LifecycleCommandResult> {
    return this.runScopedOperation(userId, 'RESTORE', command, async (tx, operationId, now) => {
      const result = await this.repository.restore(
        tx,
        userId,
        command.id,
        command.kind,
        operationId,
        now,
        {
          ...(command.replacementAreaId !== undefined && {
            replacementAreaId: command.replacementAreaId,
          }),
          ...(command.replacementProjectId !== undefined && {
            replacementProjectId: command.replacementProjectId,
          }),
        },
      );
      if (!result.restored) return { destinationUnavailable: true as const };
      return result.affected;
    });
  }

  async permanentDelete(
    userId: string,
    command: { readonly kind: LifecycleEntityKind; readonly id: string; readonly version: number },
  ): Promise<LifecycleCommandResult> {
    return this.prisma.$transaction(async (tx) => {
      const node = await this.repository.findOrigin(userId, command.kind, command.id);
      if (!node || node.lifecycleState !== 'TRASHED') {
        return { outcome: 'NOT_FOUND' as const };
      }
      if (node.version !== command.version) {
        return { outcome: 'STALE_VERSION' as const };
      }

      const operation = await this.repository.createOperation(
        userId,
        'PERMANENT_DELETE',
        command.kind,
        command.id,
        tx,
      );
      const result = await this.repository.permanentDelete(
        tx,
        userId,
        command.id,
        command.kind,
        operation.id,
      );
      if (!result.deleted) {
        return {
          outcome: 'INVALID_STATE' as const,
          detail:
            'Silme işlemi yalnızca poundAfter süresi dolmuş Çöp kutusundaki kaynaklar için geçerlidir.',
        };
      }
      return {
        outcome: 'SUCCESS' as const,
        data: {
          id: command.id,
          lifecycleState: 'TRASHED' as const,
          version: command.version,
          affected: result.affected,
          operationId: operation.id,
          purgeAfter: null,
        },
      };
    });
  }

  async purgeExpired(
    userId: string,
  ): Promise<{ readonly tasks: number; readonly projects: number; readonly areas: number }> {
    return this.repository.purgeExpiredTombstones(userId);
  }

  async findOperationSummary(
    userId: string,
    operationId: string,
  ): Promise<LifecycleOperationSummary | null> {
    const operation = await this.prisma.lifecycleOperation.findFirst({
      where: { id: operationId, userId },
    });
    if (!operation) return null;
    const affected = await this.repository.findAffectedCounts(operationId);
    return {
      id: operation.id,
      kind: operation.kind as LifecycleOperationKind,
      rootKind: operation.rootKind as LifecycleEntityKind,
      rootId: operation.rootId,
      state: operation.state as 'PENDING' | 'COMPLETED' | 'FAILED',
      startedAt: operation.startedAt.toISOString(),
      completedAt: operation.completedAt?.toISOString() ?? null,
      affected,
      version: operation.version,
    };
  }

  private async runScopedOperation(
    userId: string,
    kind: LifecycleOperationKind,
    command: { readonly kind: LifecycleEntityKind; readonly id: string; readonly version: number },
    run: (
      tx: Prisma.TransactionClient,
      operationId: string,
      now: Date,
    ) => Promise<LifecycleCascadeCounts | { readonly destinationUnavailable: true }>,
  ): Promise<LifecycleCommandResult> {
    return this.prisma.$transaction(async (tx) => {
      const node = await this.repository.findOrigin(userId, command.kind, command.id);
      if (!node) {
        return { outcome: 'NOT_FOUND' };
      }

      if (node.version !== command.version) {
        return { outcome: 'STALE_VERSION' };
      }

      if (kind === 'ARCHIVE' && node.lifecycleState !== 'ACTIVE') {
        return { outcome: 'INVALID_STATE', detail: 'Yalnızca aktif kaynaklar arşivlenebilir.' };
      }
      if (kind === 'TRASH' && node.lifecycleState === 'TRASHED') {
        return { outcome: 'INVALID_STATE', detail: 'Kaynak zaten çöp kutusunda.' };
      }
      if (kind === 'RESTORE' && node.lifecycleState === 'ACTIVE') {
        return { outcome: 'INVALID_STATE', detail: 'Kaynak zaten aktif.' };
      }

      const now = new Date();
      const operation = await this.repository.createOperation(
        userId,
        kind,
        command.kind,
        command.id,
        tx,
      );

      const result = await run(tx, operation.id, now);

      if ('destinationUnavailable' in result) {
        return { outcome: 'DESTINATION_UNAVAILABLE', detail: 'Hedef alan/öğe mevcut değil.' };
      }

      const affected = result;
      await this.repository.completeOperation(operation.id, tx);

      const restoredNode = await this.repository.findOrigin(userId, command.kind, command.id);

      return {
        outcome: 'SUCCESS',
        data: {
          id: command.id,
          lifecycleState: (restoredNode?.lifecycleState ?? node.lifecycleState) as
            'ACTIVE' | 'ARCHIVED' | 'TRASHED',
          version: restoredNode?.version ?? node.version,
          affected,
          operationId: operation.id,
          purgeAfter: restoredNode?.purgeAfter ?? null,
        },
      };
    });
  }

  private async collectCascadePreview(
    userId: string,
    kind: LifecycleEntityKind,
    id: string,
  ): Promise<LifecycleManagedNode[]> {
    const preview: LifecycleManagedNode[] = [];

    if (kind === 'AREA') {
      const projects = await this.prisma.project.findMany({
        where: { areaId: id, userId },
        select: {
          id: true,
          name: true,
          lifecycleState: true,
          archivedAt: true,
          trashedAt: true,
          purgeAfter: true,
          version: true,
        },
      });
      for (const project of projects) {
        preview.push({
          kind: 'PROJECT',
          id: project.id,
          name: project.name,
          lifecycleState: project.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
          areaId: id,
          projectId: null,
          archivedAt: project.archivedAt?.toISOString() ?? null,
          trashedAt: project.trashedAt?.toISOString() ?? null,
          purgeAfter: project.purgeAfter?.toISOString() ?? null,
          version: project.version,
        });
      }
    }

    const tasks = await this.prisma.task.findMany({
      where:
        kind === 'PROJECT'
          ? { projectId: id, userId }
          : kind === 'AREA'
            ? { areaId: id, userId }
            : { id, userId },
      select: {
        id: true,
        title: true,
        lifecycleState: true,
        areaId: true,
        projectId: true,
        archivedAt: true,
        trashedAt: true,
        purgeAfter: true,
        version: true,
      },
    });
    for (const task of tasks) {
      preview.push({
        kind: 'TASK',
        id: task.id,
        name: task.title,
        lifecycleState: task.lifecycleState as 'ACTIVE' | 'ARCHIVED' | 'TRASHED',
        areaId: task.areaId,
        projectId: task.projectId,
        archivedAt: task.archivedAt?.toISOString() ?? null,
        trashedAt: task.trashedAt?.toISOString() ?? null,
        purgeAfter: task.purgeAfter?.toISOString() ?? null,
        version: task.version,
      });
    }

    return preview;
  }
}
