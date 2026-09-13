import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { parseApiEnvironment } from '../../../platform/config/environment';
import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { CompleteOnboardingService } from '../application/complete-onboarding.service';
import { InitiateAccountDeletionService } from '../application/initiate-account-deletion.service';
import { ReadCurrentUserService } from '../application/read-current-user.service';
import { UpdateCurrentUserService } from '../application/update-current-user.service';
import { AnonymousCsrfGuard } from './anonymous-csrf.guard';
import { parseAccountDeletionInput, parseIfMatch } from './account-deletion.schema';
import { parseCookieValue, sessionCookieName } from './auth-cookie';
import { parseIdempotencyKey } from './email-verification.schema';
import { parseOnboardingCompletion, parseUserProfilePatch } from './user.schema';
import {
  AccountDeletionProcessResponseDto,
  AccountDeletionRequestDto,
  CurrentUserProfileResponseDto,
  OnboardingCompletionRequestDto,
  OnboardingCompletionResponseDto,
  UpdateCurrentUserRequestDto,
} from './user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly environment = parseApiEnvironment();

  constructor(
    @Inject(ReadCurrentUserService)
    private readonly readCurrentUser: ReadCurrentUserService,
    @Inject(CompleteOnboardingService)
    private readonly completeOnboarding: CompleteOnboardingService,
    @Inject(InitiateAccountDeletionService)
    private readonly initiateAccountDeletion: InitiateAccountDeletionService,
    @Inject(UpdateCurrentUserService)
    private readonly updateCurrentUser: UpdateCurrentUserService,
  ) {}

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getCurrentUser',
    summary: 'Read the current account profile resolved only from the active session',
  })
  @ApiResponse({
    status: 200,
    type: CurrentUserProfileResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  async getCurrentUser(
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<CurrentUserProfileResponseDto> {
    const token = parseCookieValue(request.headers.cookie, sessionCookieName());
    const currentUser = await this.readCurrentUser.execute(token);

    if (!currentUser.authenticated) {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    response.setHeader('ETag', currentUser.etag);

    return {
      data: {
        accountLifecycleState: currentUser.profile.accountLifecycleState,
        email: currentUser.profile.primaryEmail,
        id: currentUser.profile.userId,
        inAppReminderNotificationsEnabled: currentUser.profile.inAppReminderNotificationsEnabled,
        onboardingState: currentUser.profile.onboardingState,
        timeZone: currentUser.profile.timeZone,
      },
    };
  }

  @Patch('me')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'updateCurrentUser',
    summary: 'Update current account preferences with a current User ETag',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiHeader({
    name: 'If-Match',
    required: true,
  })
  @ApiBody({
    type: UpdateCurrentUserRequestDto,
  })
  @ApiResponse({
    status: 200,
    type: CurrentUserProfileResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'The current User ETag is missing or stale.',
    status: 412,
  })
  async patchCurrentUser(
    @Body() body: unknown,
    @Headers('if-match') ifMatchHeader: unknown,
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<CurrentUserProfileResponseDto> {
    const input = parseUserProfilePatch(body);
    const result = await this.updateCurrentUser.execute({
      etag: parseIfMatch(ifMatchHeader),
      inAppReminderNotificationsEnabled: input.inAppReminderNotificationsEnabled,
      sessionToken: parseCookieValue(request.headers.cookie, sessionCookieName()),
      timeZone: input.timeZone,
    });

    if (result.outcome === 'AUTHENTICATION_REQUIRED') {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    if (result.outcome === 'PRECONDITION_REQUIRED') {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'Güncel hesap sürümü gereklidir.',
      });
    }

    if (result.outcome === 'PRECONDITION_FAILED') {
      throw new ApiProblemException({
        status: 412,
        code: 'PRECONDITION_FAILED',
        detail: 'Hesap bilgisi değişmiş. Lütfen sayfayı yenileyip tekrar deneyin.',
      });
    }

    if (result.outcome !== 'UPDATED') {
      throw new ApiProblemException({
        status: 503,
        code: 'CURRENT_USER_UPDATE_UNAVAILABLE',
        detail: 'Hesap tercihleri şu anda güncellenemedi. Lütfen daha sonra tekrar deneyin.',
      });
    }

    response.setHeader('ETag', result.etag);

    return {
      data: {
        accountLifecycleState: result.profile.accountLifecycleState,
        email: result.profile.primaryEmail,
        id: result.profile.userId,
        inAppReminderNotificationsEnabled: result.profile.inAppReminderNotificationsEnabled,
        onboardingState: result.profile.onboardingState,
        timeZone: result.profile.timeZone,
      },
    };
  }

  @Post('me/onboarding-completions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'completeCurrentUserOnboarding',
    summary: 'Complete current account onboarding with an empty or sample private space',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiHeader({
    name: 'If-Match',
    required: true,
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
  })
  @ApiBody({
    type: OnboardingCompletionRequestDto,
  })
  @ApiResponse({
    status: 200,
    type: OnboardingCompletionResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'The current User ETag is missing or stale.',
    status: 412,
  })
  @ApiResponse({
    description: 'Idempotency request is in progress or incompatible.',
    status: 409,
  })
  async completeCurrentUserOnboarding(
    @Body() body: unknown,
    @Headers('if-match') ifMatchHeader: unknown,
    @Headers('idempotency-key') idempotencyKeyHeader: unknown,
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<OnboardingCompletionResponseDto> {
    const input = parseOnboardingCompletion(body);
    const result = await this.completeOnboarding.execute({
      choice: input.choice,
      etag: parseIfMatch(ifMatchHeader),
      idempotencyKey: parseIdempotencyKey(idempotencyKeyHeader),
      sessionToken: parseCookieValue(request.headers.cookie, sessionCookieName()),
    });

    if (result.outcome === 'AUTHENTICATION_REQUIRED') {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    if (result.outcome === 'PRECONDITION_REQUIRED') {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'Güncel hesap sürümü gereklidir.',
      });
    }

    if (result.outcome === 'PRECONDITION_FAILED') {
      throw new ApiProblemException({
        status: 412,
        code: 'PRECONDITION_FAILED',
        detail: 'Hesap bilgisi değişmiş. Lütfen sayfayı yenileyip tekrar deneyin.',
      });
    }

    if (result.outcome === 'IDEMPOTENCY_KEY_REUSED') {
      throw new ApiProblemException({
        status: 422,
        code: 'IDEMPOTENCY_KEY_REUSED',
        detail: 'Idempotency-Key farklı bir istek için daha önce kullanılmış.',
      });
    }

    if (result.outcome === 'IDEMPOTENCY_IN_PROGRESS') {
      throw new ApiProblemException({
        status: 409,
        code: 'IDEMPOTENCY_IN_PROGRESS',
        detail: 'Bu istek hâlâ işleniyor. Lütfen tekrar deneyin.',
      });
    }

    if (result.outcome !== 'COMPLETED' && result.outcome !== 'REPLAYED') {
      throw new ApiProblemException({
        status: 503,
        code: 'ONBOARDING_COMPLETION_UNAVAILABLE',
        detail: 'Onboarding şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.',
      });
    }

    response.setHeader('ETag', this.completeOnboarding.etagFor(result.completion.profile));

    return {
      data: {
        choice: result.completion.choice,
        completedAt: result.completion.completedAt.toISOString(),
        next: result.completion.next,
        status: result.completion.status,
        user: {
          accountLifecycleState: result.completion.profile.accountLifecycleState,
          email: result.completion.profile.primaryEmail,
          id: result.completion.profile.userId,
          inAppReminderNotificationsEnabled:
            result.completion.profile.inAppReminderNotificationsEnabled,
          onboardingState: result.completion.profile.onboardingState,
          timeZone: result.completion.profile.timeZone,
        },
      },
    };
  }

  @Post('me/account-deletions')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'initiateAccountDeletion',
    summary: 'Start confirmed account deletion, revoke access immediately, and enqueue purge',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiHeader({
    name: 'If-Match',
    required: true,
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
  })
  @ApiBody({
    type: AccountDeletionRequestDto,
  })
  @ApiResponse({
    status: 202,
    type: AccountDeletionProcessResponseDto,
  })
  @ApiResponse({
    description: 'No valid authenticated session or recent reauthentication is present.',
    status: 401,
  })
  @ApiResponse({
    description: 'The current User ETag is missing or stale.',
    status: 412,
  })
  @ApiResponse({
    description: 'Idempotency request is in progress or incompatible.',
    status: 409,
  })
  async initiateDeletion(
    @Body() body: unknown,
    @Headers('if-match') ifMatchHeader: unknown,
    @Headers('idempotency-key') idempotencyKeyHeader: unknown,
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<AccountDeletionProcessResponseDto> {
    const input = parseAccountDeletionInput(body);
    const result = await this.initiateAccountDeletion.execute({
      confirmation: input.confirmation,
      etag: parseIfMatch(ifMatchHeader),
      idempotencyKey: parseIdempotencyKey(idempotencyKeyHeader),
      sessionToken: parseCookieValue(request.headers.cookie, sessionCookieName()),
    });

    if (result.outcome === 'AUTHENTICATION_REQUIRED') {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Oturum açmanız gerekiyor.',
      });
    }

    if (result.outcome === 'REAUTHENTICATION_REQUIRED') {
      throw new ApiProblemException({
        status: 401,
        code: 'REAUTHENTICATION_REQUIRED',
        detail: 'Bu işlem için parolanızı yeniden doğrulamanız gerekiyor.',
      });
    }

    if (result.outcome === 'PRECONDITION_REQUIRED') {
      throw new ApiProblemException({
        status: 428,
        code: 'PRECONDITION_REQUIRED',
        detail: 'Güncel hesap sürümü gereklidir.',
      });
    }

    if (result.outcome === 'PRECONDITION_FAILED') {
      throw new ApiProblemException({
        status: 412,
        code: 'PRECONDITION_FAILED',
        detail: 'Hesap bilgisi değişmiş. Lütfen sayfayı yenileyip tekrar deneyin.',
      });
    }

    if (result.outcome === 'IDEMPOTENCY_KEY_REUSED') {
      throw new ApiProblemException({
        status: 422,
        code: 'IDEMPOTENCY_KEY_REUSED',
        detail: 'Idempotency-Key farklı bir istek için daha önce kullanılmış.',
      });
    }

    if (result.outcome === 'IDEMPOTENCY_IN_PROGRESS') {
      throw new ApiProblemException({
        status: 409,
        code: 'IDEMPOTENCY_IN_PROGRESS',
        detail: 'Bu istek hâlâ işleniyor. Lütfen tekrar deneyin.',
      });
    }

    if (result.outcome !== 'ACCEPTED' && result.outcome !== 'REPLAYED') {
      throw new ApiProblemException({
        status: 503,
        code: 'ACCOUNT_DELETION_UNAVAILABLE',
        detail: 'Hesap silme işlemi şu anda başlatılamadı. Lütfen daha sonra tekrar deneyin.',
      });
    }

    response.clearCookie(sessionCookieName(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.environment.COOKIE_SECURE,
    });

    return {
      data: {
        accessRevokedAt: result.process.accessRevokedAt.toISOString(),
        primaryPurgePending: true,
        processId: result.process.processId,
        requestedAt: result.process.requestedAt.toISOString(),
        state: result.process.state,
      },
    };
  }
}
