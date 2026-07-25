import {
  Body,
  Controller,
  Get,
  Header,
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
import { RegisterAccountService } from '../application/register-account.service';
import { AnonymousCsrfGuard, anonymousCsrfCookieName } from './anonymous-csrf.guard';
import {
  CsrfTokenResponseDto,
  RegisterAccountRequestDto,
  RegistrationAcceptedResponseDto,
} from './auth.dto';
import { parseRegistrationInput } from './registration.schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly environment = parseApiEnvironment();

  constructor(
    @Inject(CsrfService)
    private readonly csrf: CsrfService,
    @Inject(RegisterAccountService)
    private readonly registerAccount: RegisterAccountService,
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
}
