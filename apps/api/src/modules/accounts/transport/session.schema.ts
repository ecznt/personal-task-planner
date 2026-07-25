import { z } from 'zod';

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
    returnTo: z.string().max(2_048).optional(),
  })
  .strict();

export type LoginInput = {
  readonly email: string;
  readonly password: string;
  readonly returnTo: string;
};

export function parseLoginInput(value: unknown): LoginInput {
  const parsed = loginSchema.safeParse(value);

  if (!parsed.success) {
    throw parsed.error;
  }

  return {
    email: parsed.data.email,
    password: parsed.data.password,
    returnTo: safeReturnPath(parsed.data.returnTo),
  };
}

export function safeReturnPath(value: string | undefined): string {
  if (
    value === undefined ||
    !value.startsWith('/app/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('#')
  ) {
    return '/app/today';
  }

  try {
    const parsed = new URL(value, 'https://planner.invalid');

    if (parsed.origin !== 'https://planner.invalid' || !parsed.pathname.startsWith('/app/')) {
      return '/app/today';
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return '/app/today';
  }
}
