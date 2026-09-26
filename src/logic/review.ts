// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { addDays, isLocalDate, localDate, type LocalDate } from './date';
import { FORM_KEYS, type FormKey } from './forms';

/**
 * Days until the next review after a correct answer in box 1, 2, 3, ...
 * Items are never removed: the top box (MASTERED_BOX) keeps repeating the last interval,
 * so that learned forms are checked again and a miss sends them back to box 1.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 15] as const;
export const MASTERED_BOX = REVIEW_INTERVALS_DAYS.length + 1;

export type ReviewItem = {
  base: string;
  key: FormKey;
  /** 1 to MASTERED_BOX. A wrong answer puts the item back in box 1. */
  box: number;
  /** The item is asked on or after this date. */
  due: LocalDate;
  /** Total number of wrong answers. */
  miss: number;
  /** When the item was last answered wrongly (epoch milliseconds). */
  lastMissAt: number;
};

/** Keyed by `reviewId()`. */
export type ReviewList = Record<string, ReviewItem>;

export type ReviewChange =
  | { kind: 'added' }
  /** `box` is the new box, which stays at MASTERED_BOX once reached. */
  | { kind: 'advanced'; box: number; inDays: number }
  /** Answered correctly before its due date, e.g. while practising all verbs; nothing changes. */
  | { kind: 'not-due' }
  | { kind: 'none' };

export const reviewId = (base: string, key: FormKey) => `${base}|${key}`;

export const isDue = (item: ReviewItem, today: LocalDate) => item.due <= today;

export function recordAnswer(
  list: ReviewList,
  base: string,
  key: FormKey,
  correct: boolean,
  now: number,
): { list: ReviewList; change: ReviewChange } {
  const id = reviewId(base, key);
  const item = list[id];
  const today = localDate(now);
  if (!correct) {
    const miss = (item?.miss ?? 0) + 1;
    const reset: ReviewItem = { base, key, box: 1, due: today, miss, lastMissAt: now };
    return { list: { ...list, [id]: reset }, change: { kind: 'added' } };
  }
  if (!item) return { list, change: { kind: 'none' } };
  // Only answers on or after the due date count, so repeating an item in one day cannot rush it through.
  if (!isDue(item, today)) return { list, change: { kind: 'not-due' } };
  const inDays = REVIEW_INTERVALS_DAYS[Math.min(item.box, REVIEW_INTERVALS_DAYS.length) - 1]!;
  const box = Math.min(item.box + 1, MASTERED_BOX);
  const advanced: ReviewItem = { ...item, box, due: addDays(today, inDays) };
  return { list: { ...list, [id]: advanced }, change: { kind: 'advanced', box, inDays } };
}

/** Items to ask today: most-missed first, ties broken by the most recent mistake. */
export function dueItems(list: ReviewList, today: LocalDate): ReviewItem[] {
  return Object.values(list)
    .filter((it) => isDue(it, today))
    .sort((a, b) => b.miss - a.miss || b.lastMissAt - a.lastMissAt);
}

/** Items to ask on a later day, soonest first. */
export function upcomingItems(list: ReviewList, today: LocalDate): ReviewItem[] {
  return Object.values(list)
    .filter((it) => !isDue(it, today))
    .sort((a, b) => a.due.localeCompare(b.due) || b.miss - a.miss);
}

// ---------- persistence ----------

export const REVIEW_DATA_VERSION = 2;

export type ReviewData = { version: typeof REVIEW_DATA_VERSION; items: ReviewList };

export function toReviewData(list: ReviewList): ReviewData {
  return { version: REVIEW_DATA_VERSION, items: list };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isFormKey = (v: unknown): v is FormKey => (FORM_KEYS as readonly unknown[]).includes(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

function parseItem(raw: unknown): ReviewItem | null {
  if (!isObject(raw)) return null;
  const { base, key, box, due, miss, lastMissAt } = raw;
  if (typeof base !== 'string' || !isFormKey(key) || !isLocalDate(due) || !isCount(miss) || !isCount(lastMissAt))
    return null;
  if (!Number.isInteger(box) || (box as number) < 1 || (box as number) > MASTERED_BOX) return null;
  return { base, key, box: box as number, due, miss, lastMissAt };
}

/**
 * Version 1 (the prototype) stored `{ [id]: { base, key, miss, streak, t } }` without a version field.
 * Its items restart from box 1 and are due today, since v1 had no notion of dates.
 */
function parseV1Item(raw: unknown, today: LocalDate): ReviewItem | null {
  if (!isObject(raw)) return null;
  const { base, key, miss, t } = raw;
  if (typeof base !== 'string' || !isFormKey(key) || !isCount(miss) || !isCount(t)) return null;
  return { base, key, box: 1, due: today, miss, lastMissAt: t };
}

/**
 * Reads stored or imported review data of any known version, dropping malformed items.
 * Returns null when the data is not review data at all.
 */
export function parseReviewData(raw: unknown, now: number): ReviewList | null {
  if (!isObject(raw)) return null;
  const versioned = 'version' in raw;
  if (versioned && (raw.version !== REVIEW_DATA_VERSION || !isObject(raw.items))) return null;
  const today = localDate(now);
  const entries = Object.values(versioned ? (raw.items as Record<string, unknown>) : raw);
  const list: ReviewList = {};
  for (const entry of entries) {
    const item = versioned ? parseItem(entry) : parseV1Item(entry, today);
    if (item) list[reviewId(item.base, item.key)] = item;
  }
  return list;
}
