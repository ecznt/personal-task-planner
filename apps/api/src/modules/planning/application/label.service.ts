import { Inject, Injectable } from '@nestjs/common';

import { LabelRepository } from '../infrastructure/label.repository';
import type { Label, LabelDetail, LabelSummary } from '../domain/label.entity';

export type CreateLabelCommand = {
  readonly name: string;
};

export type CreateLabelResult =
  | { readonly outcome: 'SUCCESS'; readonly label: Label; readonly etag: number }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'CONFLICT'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type GetLabelQuery = {
  readonly labelId: string;
};

export type GetLabelResult =
  | { readonly outcome: 'SUCCESS'; readonly data: LabelDetail; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ListLabelsQuery = {
  readonly cursor?: string | undefined;
  readonly limit?: number;
};

export type ListLabelsResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly labels: readonly LabelSummary[];
      readonly nextCursor?: string;
    }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type RenameLabelCommand = {
  readonly labelId: string;
  readonly name: string;
  readonly version: number;
};

export type RenameLabelResult =
  | { readonly outcome: 'SUCCESS'; readonly label: Label; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'CONFLICT'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type DeleteLabelCommand = {
  readonly labelId: string;
  readonly version: number;
};

export type DeleteLabelResult =
  | { readonly outcome: 'SUCCESS' }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'UNAUTHENTICATED' };

function normalizeLabelName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LabelService {
  constructor(@Inject(LabelRepository) private readonly labelRepository: LabelRepository) {}

  async createLabel(userId: string, command: CreateLabelCommand): Promise<CreateLabelResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Etiket adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Etiket adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = normalizeLabelName(name);
    const existing = await this.labelRepository.findByName(userId, normalizedName);

    if (existing) {
      return { outcome: 'CONFLICT', detail: 'Bu isimde bir etiket zaten mevcut.' };
    }

    const label = await this.labelRepository.createLabel(userId, name, normalizedName);

    return { outcome: 'SUCCESS', label, etag: 1 };
  }

  async getLabel(userId: string, query: GetLabelQuery): Promise<GetLabelResult> {
    const data = await this.labelRepository.findById(userId, query.labelId);

    if (!data) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'SUCCESS', data, etag: 1 };
  }

  async listLabels(userId: string, query: ListLabelsQuery): Promise<ListLabelsResult> {
    const { labels, nextCursor } = await this.labelRepository.listByUser(
      userId,
      query.cursor,
      query.limit,
    );

    return {
      outcome: 'SUCCESS',
      labels,
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async renameLabel(userId: string, command: RenameLabelCommand): Promise<RenameLabelResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Etiket adı boş olamaz.' };
    }

    if (name.length > 100) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Etiket adı 100 karakterden uzun olamaz.' };
    }

    const normalizedName = normalizeLabelName(name);
    const existing = await this.labelRepository.findByName(userId, normalizedName);

    if (existing && existing.id !== command.labelId) {
      return { outcome: 'CONFLICT', detail: 'Bu isimde bir etiket zaten mevcut.' };
    }

    const label = await this.labelRepository.updateName(
      userId,
      command.labelId,
      name,
      normalizedName,
      command.version,
    );

    if (!label) {
      const current = await this.labelRepository.findById(userId, command.labelId);

      if (!current) {
        return { outcome: 'NOT_FOUND' };
      }

      return { outcome: 'STALE_VERSION' };
    }

    return { outcome: 'SUCCESS', label, etag: label.version };
  }

  async deleteLabel(userId: string, command: DeleteLabelCommand): Promise<DeleteLabelResult> {
    const deleted = await this.labelRepository.delete(userId, command.labelId, command.version);

    if (!deleted) {
      const current = await this.labelRepository.findById(userId, command.labelId);

      if (!current) {
        return { outcome: 'NOT_FOUND' };
      }

      return { outcome: 'STALE_VERSION' };
    }

    return { outcome: 'SUCCESS' };
  }
}
