// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { FormKey } from './forms';

/** Consecutive correct answers needed to take an item off the review list. */
export const STREAK_TO_CLEAR = 2;

export type ReviewItem = {
  base: string;
  key: FormKey;
  /** Total number of wrong answers. */
  miss: number;
  /** Consecutive correct answers since the last mistake. */
  streak: number;
  /** When the item was last answered wrongly (epoch milliseconds). */
  t: number;
};

/** Keyed by `reviewId()`. The shape is persisted in localStorage, so keep it backward compatible. */
export type ReviewList = Record<string, ReviewItem>;

export type ReviewChange = 'added' | 'progressed' | 'cleared' | 'none';

export const reviewId = (base: string, key: FormKey) => `${base}|${key}`;

export function recordAnswer(
  list: ReviewList,
  base: string,
  key: FormKey,
  correct: boolean,
  now: number,
): { list: ReviewList; change: ReviewChange } {
  const id = reviewId(base, key);
  const item = list[id];
  if (!correct) {
    const miss = (item?.miss ?? 0) + 1;
    return { list: { ...list, [id]: { base, key, miss, streak: 0, t: now } }, change: 'added' };
  }
  if (!item) return { list, change: 'none' };
  const streak = item.streak + 1;
  if (streak >= STREAK_TO_CLEAR) {
    const { [id]: _cleared, ...rest } = list;
    return { list: rest, change: 'cleared' };
  }
  return { list: { ...list, [id]: { ...item, streak } }, change: 'progressed' };
}

/** Most-missed first; ties are broken by the most recent mistake. */
export function sortForDisplay(list: ReviewList): ReviewItem[] {
  return Object.values(list).sort((a, b) => b.miss - a.miss || b.t - a.t);
}
