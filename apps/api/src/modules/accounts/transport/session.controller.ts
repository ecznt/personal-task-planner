import {
  Body,
  Controller,
  Delete,
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
import { LoginService } from '../application/login.service';
import { LogoutService } from '../application/logout.service';
import { ReadSessionService } from '../application/read-session.service';
import { AnonymousCsrfGuard } from './anonymous-csrf.guard';
import { parseCookieValue, sessionCookieName } from './auth-cookie';
import { LoginRequestDto, LoginResponseDto, SessionStateResponseDto } from './session.dto';
import { parseLoginInput } from './session.schema';

@ApiTags('Authentication')
@Controller('auth')
export class SessionController {
  private readonly environment = parseApiEnvironment();

  constructor(
    @Inject(LoginService)
    private readonly login: LoginService,
    @Inject(LogoutService)
    private readonly logout: LogoutService,
    @Inject(ReadSessionService)
    private readonly readSession: ReadSessionService,
  ) {}

  @Get('session')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'getAuthSession',
    summary: 'Read safe current session state without exposing a session identifier',
  })
  @ApiResponse({
    status: 200,
    type: SessionStateResponseDto,
  })
  async getSession(@Req() request: Request): Promise<SessionStateResponseDto> {
    const token = parseCookieValue(request.headers.cookie, sessionCookieName());
    const session = await this.readSession.execute(token);

    if (!session.authenticated) {
      return {
        data: {
          authenticated: false,
        },
      };
    }

    return {
      data: {
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
        authenticated: true,
        email: session.primaryEmail,
        idleExpiresAt: session.idleExpiresAt.toISOString(),
      },
    };
  }

  @Delete('session')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'deleteAuthSession',
    summary: 'Idempotently revoke the current opaque session before clearing its cookie',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiResponse({
    description: 'Current session is absent or revoked and its cookie is cleared.',
    status: 204,
  })
  @ApiResponse({
    description: 'Origin or CSRF validation failed.',
    status: 403,
  })
  async deleteSession(
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<void> {
    const token = parseCookieValue(request.headers.cookie, sessionCookieName());

    await this.logout.execute(token);
    response.clearCookie(sessionCookieName(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.environment.COOKIE_SECURE,
    });
  }

  @Post('sessions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(AnonymousCsrfGuard)
  @ApiOperation({
    operationId: 'createAuthSession',
    summary: 'Create a rotated opaque session with verified email/password credentials',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
  })
  @ApiBody({
    type: LoginRequestDto,
  })
  @ApiResponse({
    status: 200,
    type: LoginResponseDto,
  })
  @ApiResponse({
    description: 'Credentials did not authenticate.',
    status: 401,
  })
  @ApiResponse({
    description: 'Correct credentials require email verification before sign-in.',
    status: 409,
  })
  @ApiResponse({
    description: 'Generic login rate limit.',
    status: 429,
  })
  async createSession(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<LoginResponseDto> {
    const input = parseLoginInput(body);
    const previousSessionToken = parseCookieValue(request.headers.cookie, sessionCookieName());
    const result = await this.login.execute({
      email: input.email,
      networkAddress: request.ip,
      password: input.password,
      returnTo: input.returnTo,
      ...(previousSessionToken === undefined ? {} : { previousSessionToken }),
    });

    if (result.outcome === 'RATE_LIMITED') {
      throw new ApiProblemException({
        status: 429,
        code: 'RATE_LIMITED',
        detail: 'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    if (result.outcome === 'AUTHENTICATION_FAILED') {
      throw new ApiProblemException({
        status: 401,
        code: 'AUTHENTICATION_FAILED',
        detail: 'E-posta veya parola hatalı.',
      });
    }

    if (result.outcome === 'EMAIL_VERIFICATION_REQUIRED') {
      throw new ApiProblemException({
        status: 409,
        code: 'EMAIL_VERIFICATION_REQUIRED',
        detail: 'Giriş yapmadan önce e-posta adresinizi doğrulayın.',
      });
    }

    response.cookie(sessionCookieName(), result.sessionToken, {
      expires: result.absoluteExpiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.environment.COOKIE_SECURE,
    });

    return {
      data: {
        absoluteExpiresAt: result.absoluteExpiresAt.toISOString(),
        authenticated: true,
        email: result.primaryEmail,
        idleExpiresAt: result.idleExpiresAt.toISOString(),
        next: result.next,
      },
    };
  }
}
