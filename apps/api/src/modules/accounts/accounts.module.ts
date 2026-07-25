import { Module } from '@nestjs/common';

import { CsrfService } from './application/csrf.service';
import { RegisterAccountService } from './application/register-account.service';
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
  ],
})
export class AccountsModule {}
