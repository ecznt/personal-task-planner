import { Inject, Injectable } from '@nestjs/common';

import { AreaRepository } from '../infrastructure/area.repository';
import type { Area, AreaDetail, AreaStatus, AreaSummary } from '../domain/area.entity';

export type CreateAreaCommand = {
  readonly name: string;
};

export type CreateAreaResult =
  | { readonly outcome: 'SUCCESS'; readonly area: Area; readonly statuses: readonly AreaStatus[] }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type GetAreaQuery = {
  readonly areaId: string;
};

export type GetAreaResult =
  | { readonly outcome: 'SUCCESS'; readonly data: AreaDetail }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ListAreasQuery = {
  readonly cursor?: string | undefined;
  readonly limit?: number;
};

export type ListAreasResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly areas: readonly AreaSummary[];
      readonly nextCursor?: string;
    }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type RenameAreaCommand = {
  readonly areaId: string;
  readonly name: string;
  readonly version: number;
};

export type RenameAreaResult =
  | { readonly outcome: 'SUCCESS'; readonly area: Area }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type CreateAreaStatusCommand = {
  readonly areaId: string;
  readonly name: string;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly version: number;
};

export type CreateAreaStatusResult =
  | { readonly outcome: 'SUCCESS'; readonly status: AreaStatus; readonly areaVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type UpdateAreaStatusNameCommand = {
  readonly areaId: string;
  readonly statusId: string;
  readonly name: string;
  readonly version: number;
};

export type UpdateAreaStatusNameResult =
  | { readonly outcome: 'SUCCESS'; readonly status: AreaStatus; readonly areaVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type RetireAreaStatusCommand = {
  readonly areaId: string;
  readonly statusId: string;
  readonly version: number;
};

export type RetireAreaStatusResult =
  | { readonly outcome: 'SUCCESS'; readonly areaVersion: number; readonly migratedCount: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ActivateAreaStatusCommand = {
  readonly areaId: string;
  readonly statusId: string;
  readonly version: number;
};

export type ActivateAreaStatusResult =
  | { readonly outcome: 'SUCCESS'; readonly areaVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ReorderAreaStatusesCommand = {
  readonly areaId: string;
  readonly statusIds: readonly string[];
  readonly version: number;
};

export type ReorderAreaStatusesResult =
  | { readonly outcome: 'SUCCESS'; readonly areaVersion: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

@Injectable()
export class AreaService {
  constructor(@Inject(AreaRepository) private readonly areaRepository: AreaRepository) {}

  async createArea(userId: string, command: CreateAreaCommand): Promise<CreateAreaResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Alan adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Alan adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = name.toLowerCase();

    const { area, statuses } = await this.areaRepository.createArea(userId, name, normalizedName);

    return { outcome: 'SUCCESS', area, statuses };
  }

  async getArea(userId: string, query: GetAreaQuery): Promise<GetAreaResult> {
    const data = await this.areaRepository.findById(userId, query.areaId);

    if (!data) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'SUCCESS', data };
  }

  async listAreas(userId: string, query: ListAreasQuery): Promise<ListAreasResult> {
    const { areas, nextCursor } = await this.areaRepository.listByUser(
      userId,
      query.cursor,
      query.limit,
    );

    return {
      outcome: 'SUCCESS',
      areas,
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async renameArea(userId: string, command: RenameAreaCommand): Promise<RenameAreaResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Alan adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Alan adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = name.toLowerCase();

    const area = await this.areaRepository.updateName(
      userId,
      command.areaId,
      name,
      normalizedName,
      command.version,
    );

    if (!area) {
      const existing = await this.areaRepository.findById(userId, command.areaId);

      if (!existing) {
        return { outcome: 'NOT_FOUND' };
      }

      return { outcome: 'STALE_VERSION' };
    }

    return { outcome: 'SUCCESS', area };
  }

  async createAreaStatus(
    userId: string,
    command: CreateAreaStatusCommand,
  ): Promise<CreateAreaStatusResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Durum adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Durum adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = name.toLowerCase();

    const result = await this.areaRepository.createStatus(
      userId,
      command.areaId,
      name,
      normalizedName,
      command.canonicalStatus,
    );

    if ('error' in result) {
      if (result.error === 'NOT_FOUND') {
        return { outcome: 'NOT_FOUND' };
      }
      return { outcome: 'VALIDATION_ERROR', detail: 'Bu isimde bir durum zaten var.' };
    }

    return { outcome: 'SUCCESS', status: result.status, areaVersion: result.areaVersion };
  }

  async updateAreaStatusName(
    userId: string,
    command: UpdateAreaStatusNameCommand,
  ): Promise<UpdateAreaStatusNameResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Durum adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Durum adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = name.toLowerCase();

    const result = await this.areaRepository.updateStatusName(
      userId,
      command.areaId,
      command.statusId,
      name,
      normalizedName,
      command.version,
    );

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          return { outcome: 'NOT_FOUND' };
        case 'STALE_VERSION':
          return { outcome: 'STALE_VERSION' };
        case 'DUPLICATE_NAME':
          return { outcome: 'VALIDATION_ERROR', detail: 'Bu isimde bir durum zaten var.' };
        case 'CANNOT_RENAME_DEFAULT':
          return {
            outcome: 'VALIDATION_ERROR',
            detail: 'Varsayılan durumlar yeniden adlandırılamaz.',
          };
      }
    }

    return { outcome: 'SUCCESS', status: result.status, areaVersion: result.areaVersion };
  }

  async retireAreaStatus(
    userId: string,
    command: RetireAreaStatusCommand,
  ): Promise<RetireAreaStatusResult> {
    const result = await this.areaRepository.retireStatus(
      userId,
      command.areaId,
      command.statusId,
      command.version,
    );

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          return { outcome: 'NOT_FOUND' };
        case 'STALE_VERSION':
          return { outcome: 'STALE_VERSION' };
        case 'CANNOT_RETIRE_DEFAULT':
          return { outcome: 'VALIDATION_ERROR', detail: 'Varsayılan durumlar emekli edilemez.' };
      }
    }

    return {
      outcome: 'SUCCESS',
      areaVersion: result.areaVersion,
      migratedCount: result.migratedCount,
    };
  }

  async activateAreaStatus(
    userId: string,
    command: ActivateAreaStatusCommand,
  ): Promise<ActivateAreaStatusResult> {
    const result = await this.areaRepository.activateStatus(
      userId,
      command.areaId,
      command.statusId,
      command.version,
    );

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          return { outcome: 'NOT_FOUND' };
        case 'STALE_VERSION':
          return { outcome: 'STALE_VERSION' };
      }
    }

    return { outcome: 'SUCCESS', areaVersion: result.areaVersion };
  }

  async reorderAreaStatuses(
    userId: string,
    command: ReorderAreaStatusesCommand,
  ): Promise<ReorderAreaStatusesResult> {
    if (command.statusIds.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'En az bir durum seçmelisiniz.' };
    }

    const result = await this.areaRepository.reorderStatuses(
      userId,
      command.areaId,
      command.statusIds,
      command.version,
    );

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          return { outcome: 'NOT_FOUND' };
        case 'STALE_VERSION':
          return { outcome: 'STALE_VERSION' };
        case 'VALIDATION_ERROR':
          return { outcome: 'VALIDATION_ERROR', detail: 'Geçersiz durum listesi.' };
      }
    }

    return { outcome: 'SUCCESS', areaVersion: result.areaVersion };
  }
}
