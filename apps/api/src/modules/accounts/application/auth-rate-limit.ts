export function secondsUntilWindowEnd(now: Date, windowMinutes: number): number {
  const currentWindowMinute = Math.floor(now.getUTCMinutes() / windowMinutes) * windowMinutes;
  const nextWindow = new Date(now);
  nextWindow.setUTCMinutes(currentWindowMinute + windowMinutes, 0, 0);

  return Math.max(1, Math.ceil((nextWindow.getTime() - now.getTime()) / 1_000));
}
