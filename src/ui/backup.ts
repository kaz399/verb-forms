// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { backupFileName, createBackup, parseBackup, type BackupContent } from '../logic/backup';
import { app, setReview, setStats } from './app';

const BACKUP_MIME_TYPE = 'application/json';

const describe = (c: BackupContent) =>
  `復習リスト ${Object.keys(c.review).length}個・学習の記録 ${Object.keys(c.stats).length}日分`;

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  // Revoking at once can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Saves the current record to a file. Returns a message for the learner, or '' when cancelled. */
export async function saveBackupFile(): Promise<string> {
  const now = Date.now();
  const content = { review: app.review, stats: app.stats };
  const file = new File([JSON.stringify(createBackup(content, now), null, 2)], backupFileName(now), {
    type: BACKUP_MIME_TYPE,
  });
  // On iPhone and iPad the share sheet offers "Save to Files" and AirDrop. On a desktop it lacks a
  // plain "save" choice, so a normal download is used there.
  const touchFirst = matchMedia('(pointer: coarse)').matches;
  if (touchFirst && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return `記録を保存しました（${describe(content)}）。`;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return '';
      // Fall back to a download when sharing is unavailable for any other reason.
    }
  }
  download(file);
  return `記録を ${file.name} に保存しました（${describe(content)}）。`;
}

/** Replaces the current record with a backup file after confirmation. Returns a message for the learner. */
export async function loadBackupFile(file: File): Promise<string> {
  const result = parseBackup(await file.text(), Date.now());
  if (!result.ok) {
    return {
      'not-backup': 'このファイルは「動詞のかたち」の記録ではないため、読み込めませんでした。',
      'newer-format': 'このファイルは新しい版のアプリで保存されています。ページを再読み込みしてから、もう一度試してください。',
      broken: 'ファイルが壊れているため、読み込めませんでした。',
    }[result.reason];
  }
  const current = { review: app.review, stats: app.stats };
  const ok = confirm(
    `いまの記録（${describe(current)}）を、ファイルの記録（${describe(result)}）で置き換えますか？\n` +
      'いまの記録は元に戻せません。',
  );
  if (!ok) return '読み込みをやめました。いまの記録はそのままです。';
  setReview(result.review);
  setStats(result.stats);
  return `記録を読み込みました（${describe(result)}）。`;
}
