// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { addDays, isLocalDate, localDate, type LocalDate } from './date';
import type { Diagnosis, Mistake } from './diagnose';
import { FORM_KEYS, type FormKey } from './forms';

export type AnswerMode = 'choose' | 'type';
/** `verb` is practice on one verb started from its card; `all` asks random verbs. */
export type AnswerRange = 'all' | 'verb' | 'review';

export const ANSWER_MODES: readonly AnswerMode[] = ['choose', 'type'];
export const ANSWER_RANGES: readonly AnswerRange[] = ['all', 'verb', 'review'];

export type Tally = { total: number; correct: number };

/** Counts for one day. Only daily totals are kept, so the data stays small however long the app is used. */
export type DayStats = {
  /** Keyed by `answerCellId()`. */
  answers: Record<string, Tally>;
  /** Keyed by `mistakeId()`. */
  mistakes: Record<string, number>;
};

export type Stats = Record<LocalDate, DayStats>;

export type AnswerCell = { mode: AnswerMode; range: AnswerRange; key: FormKey };

export const answerCellId = (c: AnswerCell) => `${c.mode}|${c.range}|${c.key}`;

function parseAnswerCellId(id: string): AnswerCell | null {
  const [mode, range, key] = id.split('|');
  if (!ANSWER_MODES.includes(mode as AnswerMode)) return null;
  if (!ANSWER_RANGES.includes(range as AnswerRange)) return null;
  if (!FORM_KEYS.includes(key as FormKey)) return null;
  return { mode: mode as AnswerMode, range: range as AnswerRange, key: key as FormKey };
}

/**
 * Identifies the kind of mistake. Mixing up two forms is split by which forms were confused,
 * because "past participle instead of past" and "base instead of 3rd person" need different practice.
 */
export function mistakeId(expected: FormKey, mistake: Mistake): string {
  return mistake.kind === 'other-form' ? `other-form:${expected}>${mistake.form}` : mistake.kind;
}

export function recordStat(
  stats: Stats,
  answer: AnswerCell & { diagnosis: Diagnosis },
  now: number,
): Stats {
  const date = localDate(now);
  const day = stats[date] ?? { answers: {}, mistakes: {} };
  const cell = answerCellId(answer);
  const tally = day.answers[cell] ?? { total: 0, correct: 0 };
  const answers = {
    ...day.answers,
    [cell]: { total: tally.total + 1, correct: tally.correct + (answer.diagnosis.ok ? 1 : 0) },
  };
  let mistakes = day.mistakes;
  if (!answer.diagnosis.ok) {
    const id = mistakeId(answer.key, answer.diagnosis.mistake);
    mistakes = { ...mistakes, [id]: (mistakes[id] ?? 0) + 1 };
  }
  return { ...stats, [date]: { answers, mistakes } };
}

// ---------- queries ----------

/** Inclusive date range. */
export type Period = { from: LocalDate; to: LocalDate };

export const PERIOD_DAYS = 7;

/** The last PERIOD_DAYS days up to today, and the same number of days before that. */
export function recentPeriods(today: LocalDate): { current: Period; previous: Period } {
  return {
    current: { from: addDays(today, 1 - PERIOD_DAYS), to: today },
    previous: { from: addDays(today, 1 - 2 * PERIOD_DAYS), to: addDays(today, -PERIOD_DAYS) },
  };
}

function daysIn(stats: Stats, period: Period): DayStats[] {
  return Object.entries(stats)
    .filter(([date]) => period.from <= date && date <= period.to)
    .map(([, day]) => day);
}

export function tallyAnswers(stats: Stats, period: Period, include: (c: AnswerCell) => boolean = () => true): Tally {
  const sum: Tally = { total: 0, correct: 0 };
  for (const day of daysIn(stats, period)) {
    for (const [id, tally] of Object.entries(day.answers)) {
      const cell = parseAnswerCellId(id);
      if (cell && include(cell)) {
        sum.total += tally.total;
        sum.correct += tally.correct;
      }
    }
  }
  return sum;
}

export function countMistakes(stats: Stats, period: Period): Record<string, number> {
  const sum: Record<string, number> = {};
  for (const day of daysIn(stats, period)) {
    for (const [id, n] of Object.entries(day.mistakes)) sum[id] = (sum[id] ?? 0) + n;
  }
  return sum;
}

/** Number of answers on each day of the period, oldest first, including days without practice. */
export function dailyTotals(stats: Stats, period: Period): { date: LocalDate; total: number }[] {
  const out = [];
  for (let date = period.from; date <= period.to; date = addDays(date, 1)) {
    const day = stats[date];
    const total = day ? Object.values(day.answers).reduce((n, t) => n + t.total, 0) : 0;
    out.push({ date, total });
  }
  return out;
}

// ---------- persistence ----------

export const STATS_DATA_VERSION = 1;

export type StatsData = { version: typeof STATS_DATA_VERSION; days: Stats };

export function toStatsData(stats: Stats): StatsData {
  return { version: STATS_DATA_VERSION, days: stats };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

function parseTally(raw: unknown): Tally | null {
  if (!isObject(raw) || !isCount(raw.total) || !isCount(raw.correct) || raw.correct > raw.total) return null;
  return { total: raw.total, correct: raw.correct };
}

function parseDay(raw: unknown): DayStats | null {
  if (!isObject(raw) || !isObject(raw.answers) || !isObject(raw.mistakes)) return null;
  const answers: Record<string, Tally> = {};
  for (const [id, t] of Object.entries(raw.answers)) {
    const tally = parseTally(t);
    if (tally && parseAnswerCellId(id)) answers[id] = tally;
  }
  const mistakes: Record<string, number> = {};
  for (const [id, n] of Object.entries(raw.mistakes)) if (isCount(n)) mistakes[id] = n;
  return { answers, mistakes };
}

/** Reads stored or imported stats, dropping malformed days and counts. Returns null for anything else. */
export function parseStatsData(raw: unknown): Stats | null {
  if (!isObject(raw) || raw.version !== STATS_DATA_VERSION || !isObject(raw.days)) return null;
  const stats: Stats = {};
  for (const [date, d] of Object.entries(raw.days)) {
    const day = isLocalDate(date) ? parseDay(d) : null;
    if (day) stats[date] = day;
  }
  return stats;
}
