// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { localDate } from './date';
import { parseReviewData, toReviewData, type ReviewData, type ReviewList } from './review';
import { parseStatsData, toStatsData, type Stats, type StatsData } from './stats';

// Marks a file as a backup of this app. Without it, any JSON object would parse as an empty
// (legacy) review list, and importing an unrelated file would silently wipe the learner's data.
const BACKUP_APP_ID = 'verb-forms';
export const BACKUP_FORMAT = 1;

export type Backup = {
  app: typeof BACKUP_APP_ID;
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  review: ReviewData;
  stats: StatsData;
};

export type BackupContent = { review: ReviewList; stats: Stats };

export type BackupResult =
  | ({ ok: true } & BackupContent)
  /** `not-backup`: not a file from this app. `newer-format`: from a newer version of the app. */
  | { ok: false; reason: 'not-backup' | 'newer-format' | 'broken' };

export function createBackup(content: BackupContent, now: number): Backup {
  return {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT,
    exportedAt: new Date(now).toISOString(),
    review: toReviewData(content.review),
    stats: toStatsData(content.stats),
  };
}

export const backupFileName = (now: number) => `verb-forms-${localDate(now)}.json`;

/** Parses the text of a backup file. Nothing is returned partially: a broken section rejects the file. */
export function parseBackup(text: string, now: number): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not-backup' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== BACKUP_APP_ID) {
    return { ok: false, reason: 'not-backup' };
  }
  const { format, review, stats } = raw as Record<string, unknown>;
  if (typeof format === 'number' && format > BACKUP_FORMAT) return { ok: false, reason: 'newer-format' };
  if (format !== BACKUP_FORMAT) return { ok: false, reason: 'broken' };
  const reviewList = parseReviewData(review, now);
  const statsDays = parseStatsData(stats);
  // A missing version field would make parseReviewData treat the data as the legacy format.
  const reviewVersioned = typeof review === 'object' && review !== null && 'version' in review;
  if (!reviewList || !reviewVersioned || !statsDays) return { ok: false, reason: 'broken' };
  return { ok: true, review: reviewList, stats: statsDays };
}
