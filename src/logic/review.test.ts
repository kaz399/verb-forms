import { describe, expect, it } from 'vitest';
import {
  dueItems,
  MASTERED_BOX,
  parseReviewData,
  recordAnswer,
  REVIEW_DATA_VERSION,
  reviewId,
  toReviewData,
  upcomingItems,
  type ReviewItem,
  type ReviewList,
} from './review';

/** Epoch milliseconds for a local date and hour. */
const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour).getTime();
};

const item = (overrides: Partial<ReviewItem> = {}): ReviewItem => ({
  base: 'go',
  key: 'past',
  box: 1,
  due: '2026-09-26',
  miss: 1,
  lastMissAt: at('2026-09-26'),
  ...overrides,
});

const listOf = (...items: ReviewItem[]): ReviewList =>
  Object.fromEntries(items.map((it) => [reviewId(it.base, it.key), it]));

describe('recordAnswer', () => {
  describe('wrong answers', () => {
    it('add the form to box 1, due the same day', () => {
      const now = at('2026-09-26', 21);
      const { list, change } = recordAnswer({}, 'go', 'past', false, now);
      expect(change).toEqual({ kind: 'added' });
      expect(list['go|past']).toEqual({ base: 'go', key: 'past', box: 1, due: '2026-09-26', miss: 1, lastMissAt: now });
    });

    it('send a form in a later box back to box 1 and count the miss', () => {
      const start = listOf(item({ box: 3, due: '2026-09-30', miss: 2 }));
      const { list } = recordAnswer(start, 'go', 'past', false, at('2026-09-27'));
      expect(list['go|past']).toMatchObject({ box: 1, due: '2026-09-27', miss: 3 });
    });

    it('do not mutate the given list', () => {
      const start: ReviewList = {};
      recordAnswer(start, 'go', 'past', false, at('2026-09-26'));
      expect(start).toEqual({});
    });
  });

  describe('correct answers on a due form', () => {
    it.each([
      [1, 1, '2026-09-27'],
      [2, 3, '2026-09-29'],
      [3, 7, '2026-10-03'],
      [4, 15, '2026-10-11'],
    ])('in box %i schedule the next review %i day(s) later in the next box', (box, inDays, due) => {
      const { list, change } = recordAnswer(listOf(item({ box })), 'go', 'past', true, at('2026-09-26'));
      expect(change).toEqual({ kind: 'advanced', box: box + 1, inDays });
      expect(list['go|past']).toMatchObject({ box: box + 1, due });
    });

    it(`in the mastered box (${MASTERED_BOX}) keep the form and check it again 15 days later`, () => {
      const start = listOf(item({ box: MASTERED_BOX }), item({ base: 'eat' }));
      const { list, change } = recordAnswer(start, 'go', 'past', true, at('2026-09-26'));
      expect(change).toEqual({ kind: 'advanced', box: MASTERED_BOX, inDays: 15 });
      expect(list['go|past']).toMatchObject({ box: MASTERED_BOX, due: '2026-10-11' });
      expect(Object.keys(list)).toHaveLength(2);
    });

    it('count from the answer date, not from the original due date', () => {
      const late = recordAnswer(listOf(item({ box: 2, due: '2026-09-20' })), 'go', 'past', true, at('2026-09-26'));
      expect(late.list['go|past']?.due).toBe('2026-09-29');
    });

    it('reach the mastered box after four correct answers over 1 + 3 + 7 days, then recheck every 15 days', () => {
      let list = recordAnswer({}, 'go', 'past', false, at('2026-09-26', 9)).list;
      const dues = [];
      for (const day of ['2026-09-26', '2026-09-27', '2026-09-30', '2026-10-07', '2026-10-22']) {
        list = recordAnswer(list, 'go', 'past', true, at(day, 20)).list;
        dues.push(`${list['go|past']?.box}:${list['go|past']?.due}`);
      }
      expect(dues).toEqual(['2:2026-09-27', '3:2026-09-30', '4:2026-10-07', '5:2026-10-22', '5:2026-11-06']);
    });

    it('send a mastered form back to box 1 on a miss', () => {
      const { list } = recordAnswer(listOf(item({ box: MASTERED_BOX })), 'go', 'past', false, at('2026-09-26'));
      expect(list['go|past']).toMatchObject({ box: 1, due: '2026-09-26' });
    });
  });

  describe('correct answers before the due date', () => {
    it('change nothing, even late on the day before', () => {
      const start = listOf(item({ box: 2, due: '2026-09-27' }));
      const { list, change } = recordAnswer(start, 'go', 'past', true, at('2026-09-26', 23));
      expect(change).toEqual({ kind: 'not-due' });
      expect(list).toBe(start);
    });
  });

  it('ignores a correct answer on a form not on the list', () => {
    const start: ReviewList = {};
    const { list, change } = recordAnswer(start, 'go', 'past', true, at('2026-09-26'));
    expect(change).toEqual({ kind: 'none' });
    expect(list).toBe(start);
  });
});

describe('dueItems and upcomingItems', () => {
  const list = listOf(
    item({ base: 'a', due: '2026-09-26', miss: 1, lastMissAt: 5 }),
    item({ base: 'b', due: '2026-09-20', miss: 3, lastMissAt: 1 }),
    item({ base: 'c', due: '2026-09-25', miss: 1, lastMissAt: 9 }),
    item({ base: 'd', due: '2026-10-03', miss: 1 }),
    item({ base: 'e', due: '2026-09-27', miss: 1 }),
  );

  it('lists items due today or earlier, most-missed and then most recently missed first', () => {
    expect(dueItems(list, '2026-09-26').map((i) => i.base)).toEqual(['b', 'c', 'a']);
  });

  it('lists later items, soonest first', () => {
    expect(upcomingItems(list, '2026-09-26').map((i) => i.base)).toEqual(['e', 'd']);
  });
});

describe('parseReviewData', () => {
  const now = at('2026-09-26');

  it('reads back what toReviewData writes', () => {
    const list = listOf(item(), item({ base: 'eat', key: 'pp', box: 3, due: '2026-10-01', miss: 4 }));
    expect(parseReviewData(JSON.parse(JSON.stringify(toReviewData(list))), now)).toEqual(list);
  });

  it('carries over the prototype format into box 1, due today', () => {
    const v1 = { 'go|past': { base: 'go', key: 'past', miss: 2, streak: 1, t: 1234 } };
    expect(parseReviewData(v1, now)).toEqual(
      listOf({ base: 'go', key: 'past', box: 1, due: '2026-09-26', miss: 2, lastMissAt: 1234 }),
    );
  });

  it('drops malformed items and keeps the rest', () => {
    const data = {
      version: REVIEW_DATA_VERSION,
      items: {
        ok: item(),
        badKey: item({ key: 'future' as never }),
        badBox: item({ base: 'x', box: MASTERED_BOX + 1 }),
        badDate: item({ base: 'y', due: '26/09/2026' }),
        notObject: 42,
      },
    };
    expect(parseReviewData(data, now)).toEqual(listOf(item()));
  });

  it('re-keys items by their own base and form', () => {
    const data = { version: REVIEW_DATA_VERSION, items: { wrong: item() } };
    expect(Object.keys(parseReviewData(data, now)!)).toEqual(['go|past']);
  });

  it.each([
    ['null', null],
    ['a number', 42],
    ['an unknown version', { version: REVIEW_DATA_VERSION + 1, items: {} }],
    ['a version without items', { version: REVIEW_DATA_VERSION }],
  ])('rejects %s', (_, data) => {
    expect(parseReviewData(data, now)).toBeNull();
  });
});
