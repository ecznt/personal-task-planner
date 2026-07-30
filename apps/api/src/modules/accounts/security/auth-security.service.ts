import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';

import { hash, verify } from '@node-rs/argon2';
import { Injectable } from '@nestjs/common';

import { parseSecurityEnvironment } from '../../../platform/config/environment';

const argon2idOptions = {
  algorithm: 2,
  memoryCost: 19_456,
  outputLen: 32,
  parallelism: 1,
  timeCost: 2,
} as const;

@Injectable()
export class AuthSecurityService {
  private readonly environment = parseSecurityEnvironment();

  createOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  createIdentifier(): string {
    return randomUUID();
  }

  hashSecret(value: string, purpose: string): string {
    return createHmac('sha256', this.environment.AUTH_SECURITY_KEY)
      .update(`${purpose}\0${value}`, 'utf8')
      .digest('base64url');
  }

  deriveEmailVerificationCode(challengeId: string): string {
    const digest = createHmac('sha256', this.environment.AUTH_SECURITY_KEY)
      .update(`email-verification-code\0${challengeId}`, 'utf8')
      .digest();
    const numericCode = digest.readUInt32BE(0) % 100_000_000;

    return numericCode.toString().padStart(8, '0');
  }

  hashEmailVerificationCode(normalizedEmail: string, code: string): string {
    return this.hashSecret(`${normalizedEmail}\0${code}`, 'email-verification-storage');
  }

  derivePasswordResetToken(challengeId: string): string {
    return createHmac('sha256', this.environment.AUTH_SECURITY_KEY)
      .update(`password-reset-token\0${challengeId}`, 'utf8')
      .digest('base64url');
  }

  hashPasswordResetToken(token: string): string {
    return this.hashSecret(token, 'password-reset-storage');
  }

  hashPassword(password: string): Promise<string> {
    return hash(password, argon2idOptions);
  }

  verifyPassword(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  privacySafeNetworkPrefix(address: string | undefined): string {
    const normalizedAddress = stripAddressDecoration(address);

    if (isIP(normalizedAddress) === 4) {
      return normalizedAddress.split('.').slice(0, 3).join('.');
    }

    if (isIP(normalizedAddress) === 6) {
      return expandIpv6(normalizedAddress).slice(0, 4).join(':');
    }

    return 'unresolved';
  }
}

function stripAddressDecoration(address: string | undefined): string {
  if (address === undefined || address.length === 0) {
    return '';
  }

  const withoutZone = address.split('%', 1)[0] ?? '';
  return withoutZone.startsWith('::ffff:') ? withoutZone.slice(7) : withoutZone;
}

function expandIpv6(address: string): readonly string[] {
  const [left = '', right = ''] = address.split('::', 2);
  const leftParts = left.length === 0 ? [] : left.split(':');
  const rightParts = right.length === 0 ? [] : right.split(':');
  const missingPartCount = Math.max(0, 8 - leftParts.length - rightParts.length);

  return [...leftParts, ...Array.from({ length: missingPartCount }, () => '0'), ...rightParts].map(
    (part) => part.padStart(4, '0'),
  );
}

export const ARGON2ID_OPTIONS = argon2idOptions;
