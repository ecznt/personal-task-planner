import { Injectable, Inject } from '@nestjs/common';
import { ProjectRepository } from '../infrastructure/project.repository';
import { AreaRepository } from '../infrastructure/area.repository';
import type { Project, ProjectSummary, ProjectDetail } from '../domain/project.entity';

export type CreateProjectCommand = {
  readonly areaId: string;
  readonly name: string;
};

export type CreateProjectResult =
  | { readonly outcome: 'SUCCESS'; readonly project: Project; readonly etag: number }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'DUPLICATE_NAME'; readonly detail: string };

export type GetProjectQuery = {
  readonly projectId: string;
};

export type GetProjectResult =
  | { readonly outcome: 'SUCCESS'; readonly project: ProjectDetail; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' };

export type ListProjectsQuery = {
  readonly areaId: string;
  readonly cursor?: string;
  readonly limit?: number;
};

export type ListProjectsResult = {
  readonly outcome: 'SUCCESS';
  readonly projects: readonly ProjectSummary[];
  readonly nextCursor?: string;
};

export type RenameProjectCommand = {
  readonly projectId: string;
  readonly name: string;
  readonly version: number;
};

export type RenameProjectResult =
  | { readonly outcome: 'SUCCESS'; readonly project: Project; readonly etag: number }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'DUPLICATE_NAME'; readonly detail: string };

@Injectable()
export class ProjectService {
  constructor(
    @Inject(ProjectRepository) private readonly projects: ProjectRepository,
    @Inject(AreaRepository) private readonly areas: AreaRepository,
  ) {}

  async createProject(userId: string, command: CreateProjectCommand): Promise<CreateProjectResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Proje adı boş olamaz.' };
    }

    if (name.length > 100) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Proje adı en fazla 100 karakter olabilir.',
      };
    }

    const area = await this.areas.findById(userId, command.areaId);
    if (!area) {
      return { outcome: 'NOT_FOUND' };
    }

    const normalizedName = name.normalize('NFKC').toLocaleLowerCase('tr-TR');

    const existing = await this.projects.findByNormalized(userId, command.areaId, normalizedName);

    if (existing) {
      return {
        outcome: 'DUPLICATE_NAME',
        detail: 'Bu alanda aynı isimde bir proje zaten mevcut.',
      };
    }

    const project = await this.projects.createProject(userId, command.areaId, name);

    return { outcome: 'SUCCESS', project, etag: project.version };
  }

  async getProject(userId: string, query: GetProjectQuery): Promise<GetProjectResult> {
    const project = await this.projects.findById(userId, query.projectId);

    if (!project) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'SUCCESS', project, etag: project.version };
  }

  async listProjects(userId: string, query: ListProjectsQuery): Promise<ListProjectsResult> {
    const result = await this.projects.listByArea(userId, query.areaId, query.cursor, query.limit);

    return {
      outcome: 'SUCCESS',
      projects: result.projects,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }

  async renameProject(userId: string, command: RenameProjectCommand): Promise<RenameProjectResult> {
    const name = command.name.trim();

    if (name.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Proje adı boş olamaz.' };
    }

    if (name.length > 100) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Proje adı en fazla 100 karakter olabilir.',
      };
    }

    const existing = await this.projects.findById(userId, command.projectId);
    if (!existing) {
      return { outcome: 'NOT_FOUND' };
    }

    const normalizedName = name.normalize('NFKC').toLocaleLowerCase('tr-TR');

    const duplicate = await this.projects.findByNormalized(userId, existing.areaId, normalizedName);

    if (duplicate && duplicate.id !== command.projectId) {
      return {
        outcome: 'DUPLICATE_NAME',
        detail: 'Bu alanda aynı isimde bir proje zaten mevcut.',
      };
    }

    const project = await this.projects.updateName(
      userId,
      command.projectId,
      name,
      command.version,
    );

    if (!project) {
      const recheck = await this.projects.findById(userId, command.projectId);
      if (!recheck) {
        return { outcome: 'NOT_FOUND' };
      }
      return { outcome: 'STALE_VERSION' };
    }

    return { outcome: 'SUCCESS', project, etag: project.version };
  }
}
