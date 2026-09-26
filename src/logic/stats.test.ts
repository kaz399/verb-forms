import { describe, expect, it } from 'vitest';
import type { Diagnosis } from './diagnose';
import {
  accuracyPercent,
  countMistakes,
  MIN_ANSWERS_FOR_RATE,
  dailyTotals,
  mistakeId,
  parseStatsData,
  recentPeriods,
  recordStat,
  STATS_DATA_VERSION,
  tallyAnswers,
  toStatsData,
  type AnswerCell,
  type Stats,
} from './stats';

const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour).getTime();
};

const OK: Diagnosis = { ok: true };
const IRREGULAR_ED: Diagnosis = { ok: false, mistake: { kind: 'irregular-ed' } };
const PP_FOR_PAST: Diagnosis = { ok: false, mistake: { kind: 'other-form', form: 'pp' } };

const cell = (overrides: Partial<AnswerCell> = {}): AnswerCell => ({ mode: 'choose', range: 'all', key: 'past', ...overrides });

/** Records answers given as [date, cell overrides, diagnosis]. */
function build(answers: [string, Partial<AnswerCell>, Diagnosis][]): Stats {
  return answers.reduce<Stats>((s, [date, c, diagnosis]) => recordStat(s, { ...cell(c), diagnosis }, at(date)), {});
}

describe('mistakeId', () => {
  it('names a mix-up of forms by the expected and the answered form', () => {
    expect(mistakeId('past', { kind: 'other-form', form: 'pp' })).toBe('other-form:past>pp');
  });

  it('uses the mistake kind for spelling mistakes', () => {
    expect(mistakeId('past', { kind: 'irregular-ed' })).toBe('irregular-ed');
  });
});

describe('recordStat', () => {
  it('counts answers and correct answers per day, answer mode, range and form', () => {
    const stats = build([
      ['2026-09-26', {}, OK],
      ['2026-09-26', {}, IRREGULAR_ED],
      ['2026-09-26', { mode: 'type' }, OK],
      ['2026-09-27', {}, OK],
    ]);
    expect(stats['2026-09-26']?.answers).toEqual({
      'choose|all|past': { total: 2, correct: 1 },
      'type|all|past': { total: 1, correct: 1 },
    });
    expect(stats['2026-09-27']?.answers).toEqual({ 'choose|all|past': { total: 1, correct: 1 } });
  });

  it('counts mistakes by kind', () => {
    const stats = build([
      ['2026-09-26', {}, IRREGULAR_ED],
      ['2026-09-26', {}, IRREGULAR_ED],
      ['2026-09-26', {}, PP_FOR_PAST],
      ['2026-09-26', {}, OK],
    ]);
    expect(stats['2026-09-26']?.mistakes).toEqual({ 'irregular-ed': 2, 'other-form:past>pp': 1 });
  });

  it('uses the local date of the answer', () => {
    const stats = recordStat({}, { ...cell(), diagnosis: OK }, at('2026-09-26', 23));
    expect(Object.keys(stats)).toEqual(['2026-09-26']);
  });

  it('does not mutate the given stats', () => {
    const start = build([['2026-09-26', {}, OK]]);
    const copy = structuredClone(start);
    recordStat(start, { ...cell(), diagnosis: IRREGULAR_ED }, at('2026-09-26'));
    expect(start).toEqual(copy);
  });
});

describe('recentPeriods', () => {
  it('splits the last 14 days into two 7-day periods ending today', () => {
    expect(recentPeriods('2026-09-26')).toEqual({
      current: { from: '2026-09-20', to: '2026-09-26' },
      previous: { from: '2026-09-13', to: '2026-09-19' },
    });
  });
});

describe('queries', () => {
  const stats = build([
    ['2026-09-12', {}, OK], // outside both periods
    ['2026-09-13', {}, IRREGULAR_ED], // first day of the previous period
    ['2026-09-19', { key: 'pp' }, OK], // last day of the previous period
    ['2026-09-20', {}, OK], // first day of the current period
    ['2026-09-26', { range: 'review' }, PP_FOR_PAST],
    ['2026-09-26', { mode: 'type', key: 'pp' }, OK],
  ]);
  const { current, previous } = recentPeriods('2026-09-26');

  it('tally answers within a period, including both ends', () => {
    expect(tallyAnswers(stats, current)).toEqual({ total: 3, correct: 2 });
    expect(tallyAnswers(stats, previous)).toEqual({ total: 2, correct: 1 });
  });

  it('tally only the answers that match the filter', () => {
    expect(tallyAnswers(stats, current, (c) => c.range === 'all')).toEqual({ total: 2, correct: 2 });
    expect(tallyAnswers(stats, current, (c) => c.key === 'pp')).toEqual({ total: 1, correct: 1 });
    expect(tallyAnswers(stats, current, (c) => c.mode === 'choose' && c.range === 'all')).toEqual({
      total: 1,
      correct: 1,
    });
  });

  it('count mistakes within a period', () => {
    expect(countMistakes(stats, current)).toEqual({ 'other-form:past>pp': 1 });
    expect(countMistakes(stats, previous)).toEqual({ 'irregular-ed': 1 });
  });

  it('list the answers per day, filling days without practice with zero', () => {
    expect(dailyTotals(stats, current)).toEqual([
      { date: '2026-09-20', total: 1 },
      { date: '2026-09-21', total: 0 },
      { date: '2026-09-22', total: 0 },
      { date: '2026-09-23', total: 0 },
      { date: '2026-09-24', total: 0 },
      { date: '2026-09-25', total: 0 },
      { date: '2026-09-26', total: 2 },
    ]);
  });

  it('return zero for a period without data', () => {
    expect(tallyAnswers({}, current)).toEqual({ total: 0, correct: 0 });
    expect(countMistakes({}, current)).toEqual({});
  });
});

describe('accuracyPercent', () => {
  it(`is null below ${MIN_ANSWERS_FOR_RATE} answers`, () => {
    expect(accuracyPercent({ total: MIN_ANSWERS_FOR_RATE - 1, correct: MIN_ANSWERS_FOR_RATE - 1 })).toBeNull();
    expect(accuracyPercent({ total: 0, correct: 0 })).toBeNull();
  });

  it(`is a rounded percentage from ${MIN_ANSWERS_FOR_RATE} answers`, () => {
    expect(accuracyPercent({ total: MIN_ANSWERS_FOR_RATE, correct: 3 })).toBe(60);
    expect(accuracyPercent({ total: 6, correct: 5 })).toBe(83);
    expect(accuracyPercent({ total: 7, correct: 0 })).toBe(0);
  });
});

describe('parseStatsData', () => {
  it('reads back what toStatsData writes', () => {
    const stats = build([
      ['2026-09-26', {}, IRREGULAR_ED],
      ['2026-09-27', { mode: 'type', range: 'verb', key: 'ing' }, OK],
    ]);
    expect(parseStatsData(JSON.parse(JSON.stringify(toStatsData(stats))))).toEqual(stats);
  });

  it('drops malformed days and counts and keeps the rest', () => {
    const data = {
      version: STATS_DATA_VERSION,
      days: {
        '2026-09-26': {
          answers: {
            'choose|all|past': { total: 3, correct: 2 },
            'choose|all|future': { total: 1, correct: 1 },
            'type|all|pp': { total: 1, correct: 2 },
            'type|all|ing': { total: -1, correct: 0 },
          },
          mistakes: { 'irregular-ed': 2, 'spelling': 'many' },
        },
        '26/09/2026': { answers: {}, mistakes: {} },
        '2026-09-27': 'broken',
      },
    };
    expect(parseStatsData(data)).toEqual({
      '2026-09-26': { answers: { 'choose|all|past': { total: 3, correct: 2 } }, mistakes: { 'irregular-ed': 2 } },
    });
  });

  it.each([
    ['null', null],
    ['an unknown version', { version: STATS_DATA_VERSION + 1, days: {} }],
    ['data without days', { version: STATS_DATA_VERSION }],
  ])('rejects %s', (_, data) => {
    expect(parseStatsData(data)).toBeNull();
  });
});
