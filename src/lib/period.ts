import type { Period } from '../types';
import { toDateKey } from './id';

const DAY_MS = 86_400_000;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Nudges a date to the Monday of its week — Week 1 must start on one. */
export function snapToMonday(dateKey: string): string {
  const d = parseDate(dateKey);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  return toDateKey(new Date(d.getTime() + diff * DAY_MS));
}

/** Start date (a Monday) of the given 1-based week number. */
export function weekStart(period: Period, weekNumber: number): Date {
  const start = parseDate(period.startDate);
  return new Date(start.getTime() + (weekNumber - 1) * 7 * DAY_MS);
}

export function periodEndDate(period: Period): Date {
  const lastStart = weekStart(period, period.weekCount);
  return new Date(lastStart.getTime() + 6 * DAY_MS);
}

/** 1-based week number a date falls in, or null if outside the configured period. */
export function weekNumberForDate(period: Period, dateKey: string): number | null {
  const start = parseDate(period.startDate);
  const date = parseDate(dateKey);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / DAY_MS);
  if (diffDays < 0) return null;
  const week = Math.floor(diffDays / 7) + 1;
  if (week > period.weekCount) return null;
  return week;
}

type LabelablePeriod = Pick<Period, 'breakWeeks' | 'labels' | 'countBreaks'>;

export function isBreakWeek(period: Pick<Period, 'breakWeeks'>, weekNumber: number): boolean {
  return period.breakWeeks.includes(weekNumber);
}

/** 1-based week number a break week would keep if it consumed no slot — used for display only. */
function skipBreaksNumber(period: LabelablePeriod, weekNumber: number): number {
  const skipped = period.breakWeeks.filter((wk) => wk < weekNumber).length;
  return weekNumber - skipped;
}

export function weekLabel(period: LabelablePeriod, weekNumber: number): string {
  if (period.labels?.[weekNumber]) return period.labels[weekNumber];
  if (isBreakWeek(period, weekNumber)) return 'Break';
  if (period.countBreaks === false) return `Wk ${skipBreaksNumber(period, weekNumber)}`;
  return `Wk ${weekNumber}`;
}

/** ISO dates for `weekday` (0=Sun..6=Sat) that fall inside a break week, up to `until`. */
export function excludeDatesForWeekly(period: Period, weekday: number, until: string): string[] {
  const untilDate = parseDate(until);
  const result: string[] = [];
  for (const wk of period.breakWeeks) {
    const start = weekStart(period, wk);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * DAY_MS);
      if (d.getDay() !== weekday || d > untilDate) continue;
      result.push(toDateKey(d));
    }
  }
  return result;
}

/** Weekly-recurrence occurrence dates within [rangeStart, rangeEnd], skipping excludeDates. */
export function expandWeeklyOccurrences(
  startDate: string,
  until: string,
  excludeDates: string[] | undefined,
  rangeStart: Date,
  rangeEnd: Date
): string[] {
  const untilD = parseDate(until);
  const excl = new Set(excludeDates ?? []);
  const dates: string[] = [];
  let cursor = parseDate(startDate);
  while (cursor < rangeStart) cursor = new Date(cursor.getTime() + 7 * DAY_MS);
  while (cursor <= rangeEnd && cursor <= untilD) {
    const key = toDateKey(cursor);
    if (!excl.has(key)) dates.push(key);
    cursor = new Date(cursor.getTime() + 7 * DAY_MS);
  }
  return dates;
}
