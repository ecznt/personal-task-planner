import { Module } from '@nestjs/common';

import { SmtpPasswordResetEmailAdapter } from '../../platform/email/smtp-password-reset-email.adapter';
import { SmtpVerificationEmailAdapter } from '../../platform/email/smtp-verification-email.adapter';
import { EmailVerificationJobHandler } from './application/email-verification-job.handler';
import { PasswordResetJobHandler } from './application/password-reset-job.handler';
import { RESET_PASSWORD_EMAIL_DELIVERY } from './application/password-reset-email-delivery.port';
import { VERIFICATION_EMAIL_DELIVERY } from './application/verification-email-delivery.port';
import { AccountsRepository } from './infrastructure/accounts.repository';
import { AuthSecurityService } from './security/auth-security.service';

@Module({
  exports: [EmailVerificationJobHandler, PasswordResetJobHandler],
  providers: [
    AccountsRepository,
    AuthSecurityService,
    EmailVerificationJobHandler,
    PasswordResetJobHandler,
    {
      provide: RESET_PASSWORD_EMAIL_DELIVERY,
      useClass: SmtpPasswordResetEmailAdapter,
    },
    {
      provide: VERIFICATION_EMAIL_DELIVERY,
      useClass: SmtpVerificationEmailAdapter,
    },
  ],
})
export class AccountsWorkerModule {}
