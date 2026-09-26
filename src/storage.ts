// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { ReviewList } from './logic/review';

const REVIEW_STORAGE_KEY = 'verbforms.review.v1';

// Storage access can throw (e.g. when site data is blocked), and the app must keep working without it.
export function loadReview(): ReviewList {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as ReviewList) : {};
  } catch {
    return {};
  }
}

export function saveReview(list: ReviewList): void {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Keep the in-memory list; it will be lost on reload, which is the best we can do.
  }
}
