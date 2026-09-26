// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { parseReviewData, toReviewData, type ReviewList } from './logic/review';

const REVIEW_STORAGE_KEY = 'verbforms.review.v2';
// Read only once, to carry over the list saved by the prototype. It is left in place so that
// a failed save of the new format cannot lose the learner's data.
const LEGACY_REVIEW_STORAGE_KEY = 'verbforms.review.v1';

function readJson(key: string): unknown {
  const text = localStorage.getItem(key);
  return text === null ? null : JSON.parse(text);
}

// Storage access can throw (e.g. when site data is blocked), and the app must keep working without it.
export function loadReview(now: number): ReviewList {
  try {
    const current = readJson(REVIEW_STORAGE_KEY);
    return parseReviewData(current ?? readJson(LEGACY_REVIEW_STORAGE_KEY), now) ?? {};
  } catch {
    return {};
  }
}

export function saveReview(list: ReviewList): void {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(toReviewData(list)));
  } catch {
    // Keep the in-memory list; it will be lost on reload, which is the best we can do.
  }
}
