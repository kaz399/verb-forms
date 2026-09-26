import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isLocalDate, localDate } from './date';

describe('localDate', () => {
  it('uses the local calendar date at both ends of the day', () => {
    expect(localDate(new Date(2026, 8, 26, 0, 0).getTime())).toBe('2026-09-26');
    expect(localDate(new Date(2026, 8, 26, 23, 59).getTime())).toBe('2026-09-26');
  });
});

describe('addDays', () => {
  it.each([
    ['2026-09-26', 1, '2026-09-27'],
    ['2026-09-30', 1, '2026-10-01'],
    ['2026-12-29', 7, '2027-01-05'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-03-01', -1, '2026-02-28'],
  ])('%s + %i day(s) is %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
});

describe('daysBetween', () => {
  it('counts calendar days in both directions', () => {
    expect(daysBetween('2026-09-26', '2026-10-03')).toBe(7);
    expect(daysBetween('2026-10-03', '2026-09-26')).toBe(-7);
    expect(daysBetween('2026-09-26', '2026-09-26')).toBe(0);
  });
});

describe('isLocalDate', () => {
  it.each(['2026-09-26', '2027-01-05'])('accepts %s', (v) => expect(isLocalDate(v)).toBe(true));
  it.each(['2026-9-26', '26/09/2026', '', 20260926, null])('rejects %s', (v) => expect(isLocalDate(v)).toBe(false));
});
