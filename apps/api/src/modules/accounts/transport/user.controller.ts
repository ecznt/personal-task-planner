import { Controller, Get, Header, Inject, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiProblemException } from '../../../platform/http/api-problem.exception';
import { ReadCurrentUserService } from '../application/read-current-user.service';
import { parseCookieValue, sessionCookieName } from './auth-cookie';
import { CurrentUserProfileResponseDto } from './user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    @Inject(ReadCurrentUserService)
    private readonly readCurrentUser: ReadCurrentUserService,
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
}
