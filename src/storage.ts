// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { parseReviewData, toReviewData, type ReviewList } from './logic/review';
import { parseStatsData, toStatsData, type Stats } from './logic/stats';
import { INITIAL_STEP_PROGRESS, parseStepData, toStepData, type StepProgress } from './logic/steps';

const REVIEW_STORAGE_KEY = 'verbforms.review.v2';
// Read only once, to carry over the list saved by the prototype. It is left in place so that
// a failed save of the new format cannot lose the learner's data.
const LEGACY_REVIEW_STORAGE_KEY = 'verbforms.review.v1';
const STATS_STORAGE_KEY = 'verbforms.stats.v1';
const STEPS_STORAGE_KEY = 'verbforms.steps.v1';

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

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the in-memory data; it will be lost on reload, which is the best we can do.
  }
}

export function saveReview(list: ReviewList): void {
  writeJson(REVIEW_STORAGE_KEY, toReviewData(list));
}

export function loadStats(): Stats {
  try {
    return parseStatsData(readJson(STATS_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveStats(stats: Stats): void {
  writeJson(STATS_STORAGE_KEY, toStatsData(stats));
}

export function loadSteps(): StepProgress {
  try {
    return parseStepData(readJson(STEPS_STORAGE_KEY)) ?? INITIAL_STEP_PROGRESS;
  } catch {
    return INITIAL_STEP_PROGRESS;
  }
}

export function saveSteps(progress: StepProgress): void {
  writeJson(STEPS_STORAGE_KEY, toStepData(progress));
}
