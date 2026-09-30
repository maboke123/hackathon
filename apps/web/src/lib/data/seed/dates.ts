export const REFERENCE_DATE = "2026-09-30";
export const REFERENCE_YEAR = 2026;

const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function addDays(value: string, days: number): string {
  return toIsoDate(new Date(parseIsoDate(value).getTime() + days * DAY_MS));
}

export function isWeekend(value: string): boolean {
  const day = parseIsoDate(value).getUTCDay();
  return day === 0 || day === 6;
}

export function nextWorkday(value: string): string {
  let current = value;
  while (isWeekend(current)) {
    current = addDays(current, 1);
  }
  return current;
}

export function addWorkdays(start: string, workdays: number): string {
  let current = nextWorkday(start);
  let remaining = workdays - 1;
  while (remaining > 0) {
    current = addDays(current, 1);
    if (!isWeekend(current)) {
      remaining -= 1;
    }
  }
  return current;
}

export function countWorkdays(start: string, end: string): number {
  let count = 0;
  for (let current = start; current <= end; current = addDays(current, 1)) {
    if (!isWeekend(current)) {
      count += 1;
    }
  }
  return count;
}

export function workdaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toIsoDate(new Date(Date.UTC(year, month - 1, day)));
    if (!isWeekend(date)) {
      count += 1;
    }
  }
  return count;
}

export function lastWorkdayOfMonth(year: number, month: number): string {
  let current = toIsoDate(new Date(Date.UTC(year, month, 0)));
  while (isWeekend(current)) {
    current = addDays(current, -1);
  }
  return current;
}

export function yearsBetween(from: string, to: string): number {
  return (
    (parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) /
    (365.25 * DAY_MS)
  );
}
