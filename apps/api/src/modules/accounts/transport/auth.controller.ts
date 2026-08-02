import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { parseApiEnvironment } from '../../../platform/config/environment';
import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { CsrfService } from '../application/csrf.service';
import { ReauthenticateService } from '../application/reauthenticate.service';
import { RegisterAccountService } from '../application/register-account.service';
import { RequestEmailVerificationService } from '../application/request-email-verification.service';
import { RequestPasswordResetService } from '../application/request-password-reset.service';
import { ResetPasswordService } from '../application/reset-password.service';
import { VerifyEmailService } from '../application/verify-email.service';
import { AnonymousCsrfGuard, anonymousCsrfCookieName } from './anonymous-csrf.guard';
import {
  CsrfTokenResponseDto,
  EmailVerificationRequestAcceptedResponseDto,
  EmailVerificationRequestDto,
  PasswordResetRequestAcceptedResponseDto,
  PasswordResetRequestDto,
  RegisterAccountRequestDto,
  ReauthenticationRequestDto,
  ReauthenticationResponseDto,
  RegistrationAcceptedResponseDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from './auth.dto';
import {
  parseEmailVerificationRequest,
  parseIdempotencyKey,
  parseVerifyEmail,
} from './email-verification.schema';
import { parsePasswordResetRequest, parseResetPassword } from './password-reset.schema';
import { parseReauthenticationInput } from './reauthentication.schema';
import { parseRegistrationInput } from './registration.schema';
import { parseCookieValue, sessionCookieName } from './auth-cookie';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly environment = parseApiEnvironment();

  constructor(
    @Inject(CsrfService)
    private readonly csrf: CsrfService,
    @Inject(RegisterAccountService)
    private readonly registerAccount: RegisterAccountService,
    @Inject(RequestEmailVerificationService)
    private readonly requestEmailVerification: RequestEmailVerificationService,
    @Inject(VerifyEmailService)
    private readonly verifyEmail: VerifyEmailService,
    @Inject(RequestPasswordResetService)
    private readonly requestPasswordReset: RequestPasswordResetService,
    @Inject(ResetPasswordService)
    private readonly resetPassword: ResetPasswordService,
    @Inject(ReauthenticateService)
    private readonly reauthenticate: ReauthenticateService,
  ) {}

  @Get('csrf')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getAuthCsrf',
    summary: 'Issue a CSRF token for an anonymous authentication transaction',
  })
  @ApiResponse({
    status: 200,
    type: CsrfTokenResponseDto,
  })
  async getCsrf(
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<CsrfTokenResponseDto> {
    const issued = await this.csrf.issue();

    response.cookie(anonymousCsrfCookieName(), issued.browserToken, {
      httpOnly: true,
      maxAge: issued.expiresAt.getTime() - Date.now(),
      path: '/',
      sameSite: 'lax',
      secure: this.environment.COOKIE_SECURE,
    });

    return {
      data: {
        expiresAt: issued.expiresAt.toISOString(),
        token: issued.csrfToken,
      },
    };
  }

  @Post('reauthentications')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'reauthenticate',
    summary: 'Confirm the current password for one short-lived sensitive account action',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiBody({
    type: ReauthenticationRequestDto,
  })
  @ApiResponse({
    status: 200,
    type: ReauthenticationResponseDto,
  })
  @ApiResponse({
    description: 'Current session or password did not authenticate.',
    status: 401,
  })
  @ApiResponse({
    description: 'Generic reauthentication rate limit.',
    status: 429,
  })
  async reauthenticateForSensitiveAction(
    @Body() body: unknown,
    @Req() request: Request,
  ): Promise<ReauthenticationResponseDto> {
    const input = parseReauthenticationInput(body);
    const result = await this.reauthenticate.execute({
      action: input.action,
      networkAddress: request.ip,
      password: input.password,
      sessionToken: parseCookieValue(request.headers.cookie, sessionCookieName()),
    });

    if (
      result.outcome === 'AUTHENTICATION_REQUIRED' ||
      result.outcome === 'AUTHENTICATION_FAILED'
    ) {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_FAILED',
        detail: 'Kimliğiniz doğrulanamadı.',
      });
    }

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla yeniden doğrulama denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    if (result.outcome !== 'REAUTHENTICATED') {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_FAILED',
        detail: 'Kimliğiniz doğrulanamadı.',
      });
    }

    return {
      data: {
        action: result.action,
        expiresAt: result.expiresAt.toISOString(),
        status: 'REAUTHENTICATED',
      },
    };
  }

  @Post('register')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'registerAccount',
    summary: 'Submit an email/password registration without account enumeration',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiBody({
    type: RegisterAccountRequestDto,
  })
  @ApiResponse({
    status: 202,
    type: RegistrationAcceptedResponseDto,
  })
  @ApiResponse({
    description: 'Safe validation details.',
    status: 422,
  })
  @ApiResponse({
    description: 'Generic registration rate limit.',
    status: 429,
  })
  async register(
    @Body() body: unknown,
    @Req() request: Request,
  ): Promise<RegistrationAcceptedResponseDto> {
    const input = parseRegistrationInput(body);
    const result = await this.registerAccount.execute({
      email: input.email,
      networkAddress: request.ip,
      password: input.password,
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla kayıt isteği gönderildi. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    return {
      data: {
        next: '/verify-email',
        status: 'VERIFICATION_REQUIRED',
      },
    };
  }

  @Post('email-verification-requests')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'requestEmailVerification',
    summary: 'Request a fresh verification email without account enumeration',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiBody({
    type: EmailVerificationRequestDto,
  })
  @ApiResponse({
    status: 202,
    type: EmailVerificationRequestAcceptedResponseDto,
  })
  @ApiResponse({
    description: 'Safe validation details.',
    status: 422,
  })
  @ApiResponse({
    description: 'Generic verification request rate limit.',
    status: 429,
  })
  async requestVerificationEmail(
    @Body() body: unknown,
    @Req() request: Request,
  ): Promise<EmailVerificationRequestAcceptedResponseDto> {
    const input = parseEmailVerificationRequest(body);
    const result = await this.requestEmailVerification.execute({
      email: input.email,
      networkAddress: request.ip,
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla doğrulama e-postası istendi. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    return {
      data: {
        status: 'VERIFICATION_EMAIL_SENT_IF_ELIGIBLE',
      },
    };
  }

  @Post('email-verifications')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'verifyEmail',
    summary: 'Verify a pending email identity with a manual code',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiHeader({
    description: 'A unique key for this verification attempt.',
    name: 'Idempotency-Key',
    required: true,
  })
  @ApiBody({
    type: VerifyEmailRequestDto,
  })
  @ApiResponse({
    status: 200,
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    description: 'Safe validation or invalid/expired-code details.',
    status: 422,
  })
  @ApiResponse({
    description: 'The code was already used or the idempotent request is still processing.',
    status: 409,
  })
  @ApiResponse({
    description: 'Generic verification rate limit.',
    status: 429,
  })
  async confirmEmail(
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKeyHeader: unknown,
    @Req() request: Request,
  ): Promise<VerifyEmailResponseDto> {
    const input = parseVerifyEmail(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);
    const result = await this.verifyEmail.execute({
      code: input.code,
      email: input.email,
      idempotencyKey,
      networkAddress: request.ip,
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla doğrulama denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    if (result.outcome === 'INVALID_OR_EXPIRED') {
      throw new ApiProblemException({
        status: 422,
        code: 'VERIFICATION_INVALID_OR_EXPIRED',
        detail: 'Doğrulama kodu geçersiz veya süresi dolmuş.',
      });
    }

    if (result.outcome === 'ALREADY_USED') {
      throw new ApiProblemException({
        status: 409,
        code: 'VERIFICATION_ALREADY_USED',
        detail: 'Bu doğrulama kodu daha önce kullanılmış.',
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
        detail: 'Aynı doğrulama isteği halen işleniyor.',
      });
    }

    if (result.outcome === 'VERIFIED' || result.outcome === 'REPLAYED') {
      return result.response;
    }

    throw new Error('Unhandled email verification outcome.');
  }

  @Post('password-reset-requests')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'requestPasswordReset',
    summary: 'Request a password reset email without account enumeration',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiBody({
    type: PasswordResetRequestDto,
  })
  @ApiResponse({
    status: 202,
    type: PasswordResetRequestAcceptedResponseDto,
  })
  @ApiResponse({
    description: 'Safe validation details.',
    status: 422,
  })
  @ApiResponse({
    description: 'Generic password reset request rate limit.',
    status: 429,
  })
  async requestPasswordResetEmail(
    @Body() body: unknown,
    @Req() request: Request,
  ): Promise<PasswordResetRequestAcceptedResponseDto> {
    const input = parsePasswordResetRequest(body);
    const result = await this.requestPasswordReset.execute({
      email: input.email,
      networkAddress: request.ip,
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla parola sıfırlama isteği gönderildi. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    return {
      data: {
        status: 'PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE',
      },
    };
  }

  @Post('password-resets')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'resetPassword',
    summary: 'Set a new password with a password reset token',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiHeader({
    description: 'A unique key for this password reset attempt.',
    name: 'Idempotency-Key',
    required: true,
  })
  @ApiBody({
    type: ResetPasswordRequestDto,
  })
  @ApiResponse({
    description: 'Password changed and existing sessions revoked.',
    status: 204,
  })
  @ApiResponse({
    description: 'Safe validation or invalid/expired-token details.',
    status: 422,
  })
  @ApiResponse({
    description: 'The idempotent request is still processing.',
    status: 409,
  })
  @ApiResponse({
    description: 'Generic password reset rate limit.',
    status: 429,
  })
  async confirmPasswordReset(
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKeyHeader: unknown,
    @Req() request: Request,
  ): Promise<void> {
    const input = parseResetPassword(body);
    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);
    const result = await this.resetPassword.execute({
      idempotencyKey,
      networkAddress: request.ip,
      password: input.password,
      token: input.token,
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla parola sıfırlama denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    if (result.outcome === 'INVALID_OR_EXPIRED') {
      throw new ApiProblemException({
        status: 422,
        code: 'PASSWORD_RESET_INVALID_OR_EXPIRED',
        detail: 'Parola sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
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
        detail: 'Aynı parola sıfırlama isteği halen işleniyor.',
      });
    }

    if (result.outcome === 'RESET' || result.outcome === 'REPLAYED') {
      return;
    }

    throw new Error('Unhandled password reset outcome.');
  }
}
