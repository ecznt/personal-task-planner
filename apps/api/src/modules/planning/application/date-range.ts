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