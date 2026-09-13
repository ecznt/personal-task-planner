const CURATED_TIME_ZONES = [
  'Europe/Istanbul',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
] as const;

export type TimeZoneOption = {
  readonly label: string;
  readonly value: string;
};

export function detectedBrowserTimeZone(): string {
  try {
    const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (value !== undefined && value.length > 0) {
      return value;
    }
  } catch {
    // Fall through to the UTC default.
  }

  return 'UTC';
}

export function isSupportedTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: value,
    }).format(new Date('2026-01-01T00:00:00.000Z'));
    return true;
  } catch {
    return false;
  }
}

export function timeZoneOptions(preferred: readonly string[]): TimeZoneOption[] {
  const values: string[] = [];

  for (const value of [...preferred, ...CURATED_TIME_ZONES]) {
    if (!values.includes(value) && isSupportedTimeZone(value)) {
      values.push(value);
    }
  }

  return values.map((value) => ({
    label:
      value === 'UTC' ? 'UTC' : value.replaceAll('_', ' ').split('/').join(' — '),
    value,
  }));
}

export function timeZoneLabel(value: string, options: readonly TimeZoneOption[]): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatTimeZonePreview(timeZone: string, instant = new Date()): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone,
    }).format(instant);
  } catch {
    return timeZone;
  }
}