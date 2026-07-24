import { z } from 'zod';

const TRUE_VALUES = new Set(['1', 'true']);
const FALSE_VALUES = new Set(['0', 'false']);

export const booleanFromEnvironment = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value, context) => {
    if (TRUE_VALUES.has(value)) {
      return true;
    }

    if (FALSE_VALUES.has(value)) {
      return false;
    }

    context.addIssue({
      code: 'custom',
      message: 'Expected one of: true, false, 1, 0',
    });

    return z.NEVER;
  });

export function integerFromEnvironment(options: {
  readonly minimum: number;
  readonly maximum: number;
}) {
  return z.coerce.number().int().min(options.minimum).max(options.maximum);
}

export function formatEnvironmentErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
}
