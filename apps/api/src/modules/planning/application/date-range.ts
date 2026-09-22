export type TodayRange = {
  todayStart: Date;
  todayEnd: Date;
  todayStr: string;
};

export function parseTodayRange(timezone: string): TodayRange {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayStr = formatter.format(now);
  const parts = todayStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

  return { todayStart, todayEnd, todayStr };
}

export type PastDayRange = {
  date: string;
  start: Date;
  end: Date;
};

export function buildPastDayRangesInTimeZone(timezone: string, days: number): PastDayRange[] {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayParts = formatter.format(now).split('-');
  const todayStart = Date.UTC(
    Number(todayParts[0]),
    Number(todayParts[1]) - 1,
    Number(todayParts[2]),
  );

  const ranges: PastDayRange[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = new Date(todayStart - offset * 86_400_000);
    const end = new Date(start.getTime() + 86_400_000);
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    ranges.push({ date: dateFormatter.format(start), start, end });
  }

  return ranges;
}

export type CalendarDayRange = {
  date: string;
  start: Date;
  end: Date;
};

export function buildCalendarDayRanges(
  timezone: string,
  startDate: string,
  endDate: string,
): CalendarDayRange[] {
  const firstDay = UTCdayFromDateString(startDate);
  const lastDay = UTCdayFromDateString(endDate);
  const totalDays = Math.round((lastDay - firstDay) / 86_400_000) + 1;

  const dates: string[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    dates.push(formatDateOnly(new Date(firstDay + i * 86_400_000)));
  }

  return dates.map((date, index) => {
    const start = localMidnightAsUTC(date, timezone);
    const nextDate =
      dates[index + 1] ?? formatDateOnly(new Date(UTCdayFromDateString(date) + 86_400_000));
    const end = localMidnightAsUTC(nextDate, timezone);
    return { date, start, end };
  });
}

function UTCdayFromDateString(date: string): number {
  const [year, month, day] = date.split('-').map((part) => Number(part));
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function localMidnightAsUTC(date: string, timezone: string): Date {
  const guess = UTCdayFromDateString(date);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(guess));

  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const localWallAtGuess = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  );

  return new Date(guess - (localWallAtGuess - guess));
}

function formatDateOnly(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}
