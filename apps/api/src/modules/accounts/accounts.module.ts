import { Module } from '@nestjs/common';

import { CompleteOnboardingService } from './application/complete-onboarding.service';
import { CsrfService } from './application/csrf.service';
import { InitiateAccountDeletionService } from './application/initiate-account-deletion.service';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { ReauthenticateService } from './application/reauthenticate.service';
import { ReadSessionService } from './application/read-session.service';
import { ReadCurrentUserService } from './application/read-current-user.service';
import { RegisterAccountService } from './application/register-account.service';
import { RequestEmailVerificationService } from './application/request-email-verification.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { ResetPasswordService } from './application/reset-password.service';
import { UpdateCurrentUserService } from './application/update-current-user.service';
import { VerifyEmailService } from './application/verify-email.service';
import { AccountsRepository } from './infrastructure/accounts.repository';
import { AuthSecurityService } from './security/auth-security.service';
import { AnonymousCsrfGuard } from './transport/anonymous-csrf.guard';
import { AuthController } from './transport/auth.controller';
import { SessionController } from './transport/session.controller';
import { UserController } from './transport/user.controller';

@Module({
  controllers: [AuthController, SessionController, UserController],
  providers: [
    AccountsRepository,
    AnonymousCsrfGuard,
    AuthSecurityService,
    CompleteOnboardingService,
    CsrfService,
    InitiateAccountDeletionService,
    LoginService,
    LogoutService,
    ReauthenticateService,
    ReadCurrentUserService,
    ReadSessionService,
    RegisterAccountService,
    RequestEmailVerificationService,
    RequestPasswordResetService,
    ResetPasswordService,
    UpdateCurrentUserService,
    VerifyEmailService,
  ],
})
export class AccountsModule {}
