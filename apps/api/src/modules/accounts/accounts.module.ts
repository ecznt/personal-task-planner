import { Module } from '@nestjs/common';

import { CsrfService } from './application/csrf.service';
import { RegisterAccountService } from './application/register-account.service';
import { RequestEmailVerificationService } from './application/request-email-verification.service';
import { VerifyEmailService } from './application/verify-email.service';
import { AccountsRepository } from './infrastructure/accounts.repository';
import { AuthSecurityService } from './security/auth-security.service';
import { AnonymousCsrfGuard } from './transport/anonymous-csrf.guard';
import { AuthController } from './transport/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    AccountsRepository,
    AnonymousCsrfGuard,
    AuthSecurityService,
    CsrfService,
    RegisterAccountService,
    RequestEmailVerificationService,
    VerifyEmailService,
  ],
})
export class AccountsModule {}
