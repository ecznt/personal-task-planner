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
}
