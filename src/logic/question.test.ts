import { describe, expect, it } from 'vitest';
import { VERB_BY_BASE, VERBS } from '../data/verbs';
import { FORM_KEYS } from './forms';
import { askableKeys, choiceOptions, exampleSentence, makeQuestion, nextQuestion, shuffle } from './question';
import { templatesFor, type Picker } from './templates';

const verb = (base: string) => VERB_BY_BASE.get(base)!;
const first: Picker = (items) => items[0]!;
const last: Picker = (items) => items.at(-1)!;

describe('sentence templates', () => {
  it('produce exactly one blank for every verb, form and choice', () => {
    for (const v of VERBS) {
      for (const key of FORM_KEYS) {
        for (const t of templatesFor(v, key)) {
          for (const pick of [first, last]) {
            expect(t.make(v, pick).text.split('___'), `${t.id} / ${v.base}`).toHaveLength(2);
          }
        }
      }
    }
  });
});

describe('askableKeys', () => {
  it('includes every form for an ordinary verb', () => {
    expect(askableKeys(verb('go'))).toEqual([...FORM_KEYS]);
  });

  it('excludes the ing form for a verb that is rarely progressive', () => {
    expect(askableKeys(verb('see'))).not.toContain('ing');
  });
});

describe('makeQuestion', () => {
  it('asks the requested form of the verb', () => {
    const q = makeQuestion(verb('go'), 'pp', first);
    expect(q).toMatchObject({ verb: verb('go'), key: 'pp' });
    expect(q.text).toContain('___');
  });
});

describe('exampleSentence', () => {
  it('uses the present perfect for the past participle even when a passive sentence exists', () => {
    expect(exampleSentence(verb('make'), 'pp')?.text).toMatch(/\{\{(have|has)\}\}/);
  });

  it('is the same on every call', () => {
    expect(exampleSentence(verb('go'), 'past')).toEqual(exampleSentence(verb('go'), 'past'));
  });

  it('is null for a form with no template', () => {
    expect(exampleSentence(verb('see'), 'ing')).toBeNull();
  });
});

describe('choiceOptions', () => {
  it('lists each distinct form once', () => {
    expect(choiceOptions(verb('go')).sort()).toEqual(['go', 'goes', 'going', 'gone', 'went']);
    expect(choiceOptions(verb('cut')).sort()).toEqual(['cut', 'cuts', 'cutting']);
  });
});

describe('shuffle', () => {
  it('returns a permutation without changing the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, () => 0);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('nextQuestion', () => {
  it('asks only the chosen verb', () => {
    expect(nextQuestion({ kind: 'verb', verb: verb('eat') }, last)?.verb.base).toBe('eat');
  });

  it('asks a form from the review list', () => {
    const q = nextQuestion(
      { kind: 'review', targets: [{ base: 'swim', key: 'pp' }], lookup: (b) => VERB_BY_BASE.get(b) },
      first,
    );
    expect(q).toMatchObject({ verb: verb('swim'), key: 'pp' });
  });

  it('does not ask the item just asked while others are due', () => {
    const lookup = (b: string) => VERB_BY_BASE.get(b);
    const targets = [
      { base: 'go', key: 'past' },
      { base: 'eat', key: 'pp' },
    ] as const;
    const q = nextQuestion({ kind: 'review', targets, lookup, avoid: { base: 'go', key: 'past' } }, first);
    expect(q).toMatchObject({ verb: verb('eat'), key: 'pp' });
  });

  it('asks the item just asked again when it is the only one due', () => {
    const q = nextQuestion(
      {
        kind: 'review',
        targets: [{ base: 'go', key: 'past' }],
        lookup: (b) => VERB_BY_BASE.get(b),
        avoid: { base: 'go', key: 'past' },
      },
      first,
    );
    expect(q).toMatchObject({ verb: verb('go'), key: 'past' });
  });

  it('returns null when the review list is empty', () => {
    expect(nextQuestion({ kind: 'review', targets: [], lookup: (b) => VERB_BY_BASE.get(b) }, first)).toBeNull();
  });

  it('skips review entries that no longer match a verb or template', () => {
    const q = nextQuestion(
      {
        kind: 'review',
        targets: [
          { base: 'unknown', key: 'past' },
          { base: 'see', key: 'ing' },
        ],
        lookup: (b) => VERB_BY_BASE.get(b),
      },
      first,
    );
    expect(q).toBeNull();
  });
});
