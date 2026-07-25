import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';

const csrfLifetimeMilliseconds = 30 * 60 * 1_000;

@Injectable()
export class CsrfService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async issue(): Promise<{
    readonly browserToken: string;
    readonly csrfToken: string;
    readonly expiresAt: Date;
  }> {
    const browserToken = this.security.createOpaqueToken();
    const csrfToken = this.security.createOpaqueToken();
    const expiresAt = new Date(Date.now() + csrfLifetimeMilliseconds);

    await this.accounts.createAnonymousAuthTransaction({
      browserTokenHash: this.security.hashSecret(browserToken, 'csrf-browser'),
      csrfTokenHash: this.security.hashSecret(csrfToken, 'csrf-token'),
      expiresAt,
    });

    return {
      browserToken,
      csrfToken,
      expiresAt,
    };
  }

  isValid(browserToken: string, csrfToken: string): Promise<boolean> {
    return this.accounts.hasValidAnonymousAuthTransaction({
      browserTokenHash: this.security.hashSecret(browserToken, 'csrf-browser'),
      csrfTokenHash: this.security.hashSecret(csrfToken, 'csrf-token'),
      now: new Date(),
    });
  }
}
