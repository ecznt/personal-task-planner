export type Streaks = {
  readonly current: number;
  readonly best: number;
};

const formatKey = (value: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);

const addDays = (today: string, offset: number): string => {
  const [year, month, day] = today.split('-').map((part) => Number(part));
  return formatKey(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + offset)));
};

export function computeStreaks(
  activeDates: ReadonlySet<string>,
  today: string,
): Streaks {
  const has = (key: string): boolean => activeDates.has(key);

  let current = 0;
  let probe = has(today) ? today : addDays(today, -1);

  while (has(probe)) {
    current += 1;
    probe = addDays(probe, -1);
  }

  const sorted = [...activeDates].sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;

  for (const key of sorted) {
    run = previous !== undefined && isConsecutive(previous, key) ? run + 1 : 1;

    if (run > best) {
      best = run;
    }
    previous = key;
  }

  return { current, best };
}

function isConsecutive(previous: string, next: string): boolean {
  const [prevYear, prevMonth, prevDay] = previous.split('-').map((part) => Number(part));
  const [nextYear, nextMonth, nextDay] = next.split('-').map((part) => Number(part));

  const previousMs = Date.UTC(prevYear ?? 0, (prevMonth ?? 1) - 1, prevDay ?? 1);
  const nextMs = Date.UTC(nextYear ?? 0, (nextMonth ?? 1) - 1, nextDay ?? 1);

  return nextMs - previousMs === 86_400_000;
}