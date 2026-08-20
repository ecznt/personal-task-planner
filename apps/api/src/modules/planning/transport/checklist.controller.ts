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
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { AccountsRepository } from '../../accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../accounts/security/auth-security.service';
import { parseCookieValue, sessionCookieName } from '../../accounts/transport/auth-cookie';
import { ChecklistItemService } from '../application/checklist-item.service';
import type {
  AddChecklistItemResult,
  CompleteChecklistItemResult,
  DeleteChecklistItemResult,
  EditChecklistItemResult,
  ListChecklistItemsResult,
  ReopenChecklistItemResult,
} from '../application/checklist-item.service';
import { parseAddChecklistItemInput, parseEditChecklistItemInput } from './checklist.schema';
import {
  AddChecklistItemRequestDto,
  ChecklistItemListResponseDto,
  ChecklistItemResponseDto,
  EditChecklistItemRequestDto,
} from './checklist.dto';

@ApiTags('Checklist')
@Controller('tasks/:taskId/checklist-items')
export class ChecklistController {
  constructor(
    @Inject(ChecklistItemService) private readonly checklistService: ChecklistItemService,
    @Inject(AccountsRepository) private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService) private readonly security: AuthSecurityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'listChecklistItems',
    summary: 'List checklist items for a Task',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: ChecklistItemListResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Task not found.',
    status: 404,
  })
  async listChecklistItems(
    @Req() request: Request,
    @Param('taskId') taskId: string,
  ): Promise<ChecklistItemListResponseDto> {
    const userId = await this.resolveUserId(request);

    const result = await this.checklistService.listChecklistItems(userId, { taskId });

    return this.handleListResult(result);
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'addChecklistItem',
    summary: 'Add checklist item to Task',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiBody({ type: AddChecklistItemRequestDto })
  @ApiResponse({
    status: 201,
    type: ChecklistItemResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Task not found.',
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
  async addChecklistItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ChecklistItemResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseAddChecklistItemInput(body);

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

    const result = await this.checklistService.addChecklistItem(userId, {
      taskId,
      text: input.text,
      version,
    });

    return this.handleAddResult(result, response);
  }

  @Patch(':checklistItemId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'editChecklistItem',
    summary: 'Edit checklist item text',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiParam({ name: 'checklistItemId', type: String, format: 'uuid' })
  @ApiBody({ type: EditChecklistItemRequestDto })
  @ApiResponse({
    status: 200,
    type: ChecklistItemResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Item not found.',
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
  async editChecklistItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Param('checklistItemId') checklistItemId: string,
    @Body() body: unknown,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ChecklistItemResponseDto> {
    const userId = await this.resolveUserId(request);

    const input = parseEditChecklistItemInput(body);

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

    const result = await this.checklistService.editChecklistItem(userId, {
      taskId,
      checklistItemId,
      text: input.text,
      version,
    });

    return this.handleEditResult(result, response);
  }

  @Patch(':checklistItemId/complete')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'completeChecklistItem',
    summary: 'Complete checklist item',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiParam({ name: 'checklistItemId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: ChecklistItemResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Item not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  async completeChecklistItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Param('checklistItemId') checklistItemId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ChecklistItemResponseDto> {
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

    const result = await this.checklistService.completeChecklistItem(userId, {
      taskId,
      checklistItemId,
      version,
    });

    return this.handleCompleteResult(result, response);
  }

  @Patch(':checklistItemId/reopen')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'reopenChecklistItem',
    summary: 'Reopen checklist item',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiParam({ name: 'checklistItemId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    type: ChecklistItemResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Item not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  async reopenChecklistItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Param('checklistItemId') checklistItemId: string,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ChecklistItemResponseDto> {
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

    const result = await this.checklistService.reopenChecklistItem(userId, {
      taskId,
      checklistItemId,
      version,
    });

    return this.handleReopenResult(result, response);
  }

  @Delete(':checklistItemId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'deleteChecklistItem',
    summary: 'Delete checklist item',
  })
  @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
  @ApiParam({ name: 'checklistItemId', type: String, format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'Item deleted successfully.',
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'Item not found.',
    status: 404,
  })
  @ApiResponse({
    description: 'Version conflict.',
    status: 409,
  })
  async deleteChecklistItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('taskId') taskId: string,
    @Param('checklistItemId') checklistItemId: string,
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

    const result = await this.checklistService.deleteChecklistItem(userId, {
      taskId,
      checklistItemId,
      version,
    });

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

  private handleListResult(result: ListChecklistItemsResult): ChecklistItemListResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        return {
          data: result.items.map((item) => ({
            id: item.id,
            text: item.text,
            position: item.position,
            completedAt: item.completedAt?.toISOString() ?? null,
          })),
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

  private handleAddResult(
    result: AddChecklistItemResult,
    response: Response,
  ): ChecklistItemResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.status(201);
        response.setHeader('ETag', String(result.taskVersion));
        return {
          data: {
            id: result.item.id,
            text: result.item.text,
            position: result.item.position,
            completedAt: result.item.completedAt?.toISOString() ?? null,
          },
          taskVersion: result.taskVersion,
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

  private handleEditResult(
    result: EditChecklistItemResult,
    response: Response,
  ): ChecklistItemResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.taskVersion));
        return {
          data: {
            id: result.item.id,
            text: result.item.text,
            position: result.item.position,
            completedAt: result.item.completedAt?.toISOString() ?? null,
          },
          taskVersion: result.taskVersion,
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

  private handleCompleteResult(
    result: CompleteChecklistItemResult,
    response: Response,
  ): ChecklistItemResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.taskVersion));
        return {
          data: {
            id: result.item.id,
            text: result.item.text,
            position: result.item.position,
            completedAt: result.item.completedAt?.toISOString() ?? null,
          },
          taskVersion: result.taskVersion,
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
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleReopenResult(
    result: ReopenChecklistItemResult,
    response: Response,
  ): ChecklistItemResponseDto {
    switch (result.outcome) {
      case 'SUCCESS':
        response.setHeader('ETag', String(result.taskVersion));
        return {
          data: {
            id: result.item.id,
            text: result.item.text,
            position: result.item.position,
            completedAt: result.item.completedAt?.toISOString() ?? null,
          },
          taskVersion: result.taskVersion,
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
      case 'UNAUTHENTICATED':
        throw new ApiProblemException({
          status: 401,
          code: 'AUTHENTICATION_REQUIRED',
          detail: 'Oturum açmanız gerekiyor.',
        });
    }
  }

  private handleDeleteResult(result: DeleteChecklistItemResult, response: Response): void {
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
