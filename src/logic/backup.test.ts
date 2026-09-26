import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, backupFileName, createBackup, parseBackup, type BackupContent } from './backup';

const NOW = new Date(2026, 8, 26, 21, 30).getTime();

const content: BackupContent = {
  review: {
    'go|past': { base: 'go', key: 'past', box: 3, due: '2026-09-30', miss: 2, lastMissAt: 1 },
    'eat|pp': { base: 'eat', key: 'pp', box: 5, due: '2026-10-11', miss: 1, lastMissAt: 2 },
  },
  stats: {
    '2026-09-26': {
      answers: { 'choose|all|past': { total: 10, correct: 7 } },
      mistakes: { 'irregular-ed': 3 },
    },
  },
};

const serialize = (value: unknown) => JSON.stringify(value);

describe('backup', () => {
  it('restores exactly what was saved', () => {
    const text = serialize(createBackup(content, NOW));
    expect(parseBackup(text, NOW)).toEqual({ ok: true, ...content });
  });

  it('restores an empty record', () => {
    const text = serialize(createBackup({ review: {}, stats: {} }, NOW));
    expect(parseBackup(text, NOW)).toEqual({ ok: true, review: {}, stats: {} });
  });

  it('names the file with the local date', () => {
    expect(backupFileName(NOW)).toBe('verb-forms-2026-09-26.json');
  });

  describe('rejects files that are not backups of this app', () => {
    it.each([
      ['text that is not JSON', 'hello'],
      ['a JSON number', '42'],
      ['JSON null', 'null'],
      ['an unrelated object', serialize({ name: 'something else' })],
      ['an empty object', '{}'],
      ['an array', '[]'],
      ['another app', serialize({ ...createBackup(content, NOW), app: 'other-app' })],
      ['the bare review data from localStorage', serialize(createBackup(content, NOW).review)],
    ])('%s', (_, text) => {
      expect(parseBackup(text, NOW)).toEqual({ ok: false, reason: 'not-backup' });
    });
  });

  it('rejects a file from a newer version of the app', () => {
    const text = serialize({ ...createBackup(content, NOW), format: BACKUP_FORMAT + 1 });
    expect(parseBackup(text, NOW)).toEqual({ ok: false, reason: 'newer-format' });
  });

  describe('rejects a broken backup as a whole instead of importing part of it', () => {
    const backup = createBackup(content, NOW);
    it.each([
      ['without a format', { ...backup, format: undefined }],
      ['without review data', { ...backup, review: undefined }],
      ['with review data lacking its version', { ...backup, review: backup.review.items }],
      ['without stats', { ...backup, stats: undefined }],
      ['with stats of an unknown version', { ...backup, stats: { version: 99, days: {} } }],
    ])('%s', (_, value) => {
      expect(parseBackup(serialize(value), NOW)).toEqual({ ok: false, reason: 'broken' });
    });
  });
});
