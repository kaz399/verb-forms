import { describe, expect, it } from 'vitest';
import { recordAnswer, reviewId, sortForDisplay, STREAK_TO_CLEAR, type ReviewList } from './review';

const NOW = 1_000;

describe('recordAnswer', () => {
  it('adds a wrongly answered form to the list', () => {
    const { list, change } = recordAnswer({}, 'go', 'past', false, NOW);
    expect(change).toBe('added');
    expect(list[reviewId('go', 'past')]).toEqual({ base: 'go', key: 'past', miss: 1, streak: 0, t: NOW });
  });

  it('counts repeated mistakes and resets the streak', () => {
    const start: ReviewList = { 'go|past': { base: 'go', key: 'past', miss: 2, streak: 1, t: 0 } };
    const { list } = recordAnswer(start, 'go', 'past', false, NOW);
    expect(list['go|past']).toEqual({ base: 'go', key: 'past', miss: 3, streak: 0, t: NOW });
  });

  it('leaves the list unchanged when a form not on it is answered correctly', () => {
    const start: ReviewList = {};
    const { list, change } = recordAnswer(start, 'go', 'past', true, NOW);
    expect(change).toBe('none');
    expect(list).toBe(start);
  });

  it(`removes a form after ${STREAK_TO_CLEAR} consecutive correct answers`, () => {
    let list = recordAnswer({}, 'go', 'past', false, NOW).list;
    const changes = [];
    for (let i = 0; i < STREAK_TO_CLEAR; i++) {
      const r = recordAnswer(list, 'go', 'past', true, NOW);
      list = r.list;
      changes.push(r.change);
    }
    expect(changes).toEqual([...Array(STREAK_TO_CLEAR - 1).fill('progressed'), 'cleared']);
    expect(list).toEqual({});
  });

  it('does not mutate the given list', () => {
    const start: ReviewList = {};
    recordAnswer(start, 'go', 'past', false, NOW);
    expect(start).toEqual({});
  });
});

describe('sortForDisplay', () => {
  it('orders by miss count, then by the latest mistake', () => {
    const list: ReviewList = {
      a: { base: 'a', key: 'past', miss: 1, streak: 0, t: 5 },
      b: { base: 'b', key: 'past', miss: 3, streak: 0, t: 1 },
      c: { base: 'c', key: 'past', miss: 1, streak: 0, t: 9 },
    };
    expect(sortForDisplay(list).map((i) => i.base)).toEqual(['b', 'c', 'a']);
  });
});
