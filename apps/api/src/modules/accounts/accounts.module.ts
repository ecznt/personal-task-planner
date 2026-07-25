import { Module } from '@nestjs/common';

import { CsrfService } from './application/csrf.service';
import { LoginService } from './application/login.service';
import { ReadSessionService } from './application/read-session.service';
import { RegisterAccountService } from './application/register-account.service';
import { RequestEmailVerificationService } from './application/request-email-verification.service';
import { VerifyEmailService } from './application/verify-email.service';
import { AccountsRepository } from './infrastructure/accounts.repository';
import { AuthSecurityService } from './security/auth-security.service';
import { AnonymousCsrfGuard } from './transport/anonymous-csrf.guard';
import { AuthController } from './transport/auth.controller';
import { SessionController } from './transport/session.controller';

@Module({
  controllers: [AuthController, SessionController],
  providers: [
    AccountsRepository,
    AnonymousCsrfGuard,
    AuthSecurityService,
    CsrfService,
    LoginService,
    ReadSessionService,
    RegisterAccountService,
    RequestEmailVerificationService,
    VerifyEmailService,
  ],
})
export class AccountsModule {}
