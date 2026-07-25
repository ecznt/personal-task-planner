import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';

@Injectable()
export class LogoutService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(sessionToken: string | undefined): Promise<void> {
    if (sessionToken === undefined) {
      return;
    }

    await this.accounts.revokeSession({
      now: new Date(),
      tokenHash: this.security.hashSecret(sessionToken, 'session-storage'),
    });
  }
}
