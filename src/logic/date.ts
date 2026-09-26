// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

/** A calendar date in the learner's time zone, formatted as `YYYY-MM-DD` so that it sorts as text. */
export type LocalDate = string;

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export function localDate(epochMs: number): LocalDate {
  const d = new Date(epochMs);
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

export function isLocalDate(value: unknown): value is LocalDate {
  return typeof value === 'string' && LOCAL_DATE_PATTERN.test(value);
}

// Day arithmetic goes through UTC so that daylight saving shifts cannot skip or repeat a date.
function toUtcDay(date: LocalDate): number {
  const [, y, m, d] = LOCAL_DATE_PATTERN.exec(date)!;
  return Date.UTC(Number(y), Number(m) - 1, Number(d)) / DAY_MS;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date((toUtcDay(date) + days) * DAY_MS);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1, 2)}-${pad(d.getUTCDate(), 2)}`;
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return toUtcDay(to) - toUtcDay(from);
}
