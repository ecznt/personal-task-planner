const emailDisplayMaximumLength = 254;

export function normalizeEmail(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function toEmailDisplayValue(value: string): string {
  return value.trim().slice(0, emailDisplayMaximumLength);
}
