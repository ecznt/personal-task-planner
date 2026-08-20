import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { LabelService } from '../application/label.service';
import type {
  CreateLabelResult,
  DeleteLabelResult,
  GetLabelResult,
  ListLabelsResult,
  RenameLabelResult,
} from '../application/label.service';
import { parseCreateLabelInput, parseListLabelsQuery, parseRenameLabelInput } from './label.schema';
import {
  CreateLabelRequestDto,
  LabelListResponseDto,
  LabelResponseDto,
  RenameLabelRequestDto,
} from './label.dto';

@ApiTags('Labels')
@Controller('labels')
export class LabelController {
  constructor(
    @Inject(LabelService) private readonly labelService: LabelService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listLabels',
    summary: 'List User Labels',
  })
  @ApiResponse({
    status: 200,
    type: LabelListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async listLabels(
    @Req() request: Request,
    @Query() query: unknown,
  ): Promise<LabelListResponseDto> {
    const userId = await this.resolveUserId(request);
    const parsed = parseListLabelsQuery(query);

    const result = await this.labelService.listLabels(userId, {
      cursor: parsed.cursor,
      limit: parsed.limit,
    });

    return this.handleListResult(result);
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'createLabel',
    summary: 'Create Label',
  })
  @ApiBody({ type: CreateLabelRequestDto })
  @ApiResponse({
    status: 201,
    type: LabelResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Label name already exists.',
    status: 409,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async createLabel(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
  ): Promise<LabelResponseDto> {
    const userId = await this.resolveUserId(request);
    const input = parseCreateLabelInput(body);

    const result = await this.labelService.createLabel(userId, { name: input.name });

    return this.handleCreateResult(result, response);
  }

  @Get(':labelId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getLabel',
    summary: 'Get Label detail',
  })
  @ApiParam({ name: 'labelId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: LabelResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Label not found.',
    status: 404,
  })
  async getLabel(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('labelId') labelId: string,
  ): Promise<LabelResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.labelService.getLabel(userId, { labelId });

    return this.handleGetResult(result, response);
  }

  @Patch(':labelId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'renameLabel',
    summary: 'Rename Label',
  })
  @ApiParam({ name: 'labelId', type: String, format: 'uuid' })
  @ApiBody({ type: RenameLabelRequestDto })
  @ApiResponse({
    status: 200,
    type: LabelResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Label not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  @ApiResponse({
    description: 'Validation failed.',
    status: 422,
  })
  async renameLabel(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('labelId') labelId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<LabelResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseRenameLabelInput(body);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı gereklidir.',
      });
    }

    const version = parseInt(ifMatch, 10);

    if (isNaN(version)) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı geçerli bir sayı olmalıdır.',
      });
    }

    const result = await this.labelService.renameLabel(userId, {
      labelId,
      name: input.name,
      version,
    });

    return this.handleRenameResult(result, response);
  }

  @Delete(':labelId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'deleteLabel',
    summary: 'Delete Label',
  })
  @ApiParam({ name: 'labelId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'Label deleted successfully.',
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Label not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  async deleteLabel(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('labelId') labelId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(request);

    if (!ifMatch) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı gereklidir.',
      });
    }

    const version = parseInt(ifMatch, 10);

    if (isNaN(version)) {
      throw new ApiProblemException({
        status: 422,
        code: 'VALIDATION_FAILED',
        detail: 'If-Match başlığı geçerli bir sayı olmalıdır.',
      });
    }

    const result = await this.labelService.deleteLabel(userId, { labelId, version });

    this.handleDeleteResult(result, response);
  }

  private async resolveUserId(request: Request): Promise<string> {
    const token = parseCookieValue(request.headers.cookie, sessionCookieName());

    if (!token) {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    const now = new Date();
    const session = await this.accounts.findAuthenticatedSession({
      now,
      refreshAfter: new Date(now.getTime() - 5 * 60 * 1_000),
      refreshedIdleExpiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1_000),
      tokenHash: this.security.hashSecret(token, 'session-storage'),
    });

    if (session === null) {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    return session.userId;
  }

  private handleCreateResult(result: CreateLabelResult, response: Response): LabelResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.status(201);
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            id: result.label.id,
            name: result.label.name,
            version: result.label.version,
          },
        };
      case 'CONFLICT':
        throw new ApiProblemException({
          status: 409,
          code: 'LABEL_NAME_CONFLICT',
          detail: result.detail,
        });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleGetResult(result: GetLabelResult, response: Response): LabelResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            id: result.data.label.id,
            name: result.data.label.name,
            version: result.data.label.version,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleListResult(result: ListLabelsResult): LabelListResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          data: result.labels.map((label) => ({
            id: label.id,
            name: label.name,
          })),
          meta: {
            ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
          },
        };
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleRenameResult(result: RenameLabelResult, response: Response): LabelResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.etag));
        return {
          data: {
            id: result.label.id,
            name: result.label.name,
            version: result.label.version,
          },
        };
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'STALE_VERSION':
        throw new ApiProblemException({
          status: 409,
          code: 'VERSION_CONFLICT',
          detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.',
        });
      case 'CONFLICT':
        throw new ApiProblemException({
          status: 409,
          code: 'LABEL_NAME_CONFLICT',
          detail: result.detail,
        });
      case 'VALIDATION_ERROR':
        throw new ApiProblemException({
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: result.detail,
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleDeleteResult(result: DeleteLabelResult, response: Response): void {
    switch (result.outcome) {
      case 'SUCCESS':
        response.status(204).send();
        return;
      case 'NOT_FOUND':
        throw new ApiProblemException({
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          detail: 'Kaynak bulunamadı.',
        });
      case 'STALE_VERSION':
        throw new ApiProblemException({
          status: 409,
          code: 'VERSION_CONFLICT',
          detail: 'Çakışma oluştu. Lütfen sayfayı yenileyin.',
        });
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }
}
