import { Module } from '@nestjs/common';

import { SmtpVerificationEmailAdapter } from '../../platform/email/smtp-verification-email.adapter';
import { EmailVerificationJobHandler } from './application/email-verification-job.handler';
import { VERIFICATION_EMAIL_DELIVERY } from './application/verification-email-delivery.port';
import { AccountsRepository } from './infrastructure/accounts.repository';
import { AuthSecurityService } from './security/auth-security.service';

@Module({
  exports: [EmailVerificationJobHandler],
  providers: [
    AccountsRepository,
    AuthSecurityService,
    EmailVerificationJobHandler,
    {
      provide: VERIFICATION_EMAIL_DELIVERY,
      useClass: SmtpVerificationEmailAdapter,
    },
  ],
})
export class AccountsWorkerModule {}
