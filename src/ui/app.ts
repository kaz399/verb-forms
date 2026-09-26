// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { Pattern } from '../logic/forms';
import type { Question } from '../logic/question';
import type { ReviewList } from '../logic/review';
import { loadReview, saveReview } from '../storage';
import { byId } from './html';

export type Tab = 'card' | 'practice' | 'review';
export const TABS: readonly Tab[] = ['card', 'practice', 'review'];

export type PracticeState = {
  mode: 'choose' | 'type';
  range: 'all' | 'review';
  /** Restricts practice to one verb (started from its card). */
  only: string | null;
  q: Question | null;
  answered: boolean;
  right: number;
  total: number;
};

export const app = {
  tab: 'card' as Tab,
  filter: 'ALL' as Pattern | 'ALL',
  selected: 'go',
  review: loadReview(),
  practice: {
    mode: 'choose',
    range: 'all',
    only: null,
    q: null,
    answered: false,
    right: 0,
    total: 0,
  } as PracticeState,
};

export function setReview(list: ReviewList): void {
  app.review = list;
  saveReview(list);
  updateBadge();
}

export function updateBadge(): void {
  const n = Object.keys(app.review).length;
  const badge = byId('rvCount');
  badge.hidden = !n;
  badge.textContent = String(n);
}
