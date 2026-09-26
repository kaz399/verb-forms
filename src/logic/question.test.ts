import { describe, expect, it } from 'vitest';
import { VERB_BY_BASE, VERBS } from '../data/verbs';
import { buildVerb, FORM_KEYS } from './forms';
import { askableKeys, choiceOptions, exampleSentence, makeQuestion, nextQuestion, shuffle } from './question';
import { templatesFor, type Picker } from './templates';

const verb = (base: string) => VERB_BY_BASE.get(base)!;
const first: Picker = (items) => items[0]!;
const last: Picker = (items) => items.at(-1)!;

/** Every sentence any verb can produce, with each of the given pickers. */
function allSentences(pickers: Picker[] = [first, last]) {
  return VERBS.flatMap((v) =>
    FORM_KEYS.flatMap((key) =>
      templatesFor(v, key).flatMap((t) =>
        pickers.map((pick) => ({ label: `${t.id} / ${v.base}`, ...t.make(v, pick) })),
      ),
    ),
  );
}

describe('sentences of all verbs', () => {
  it('have exactly one blank', () => {
    for (const s of allSentences()) expect(s.text.split('___'), s.label).toHaveLength(2);
  });

  it('mark at least one clue word that tells which form to use', () => {
    for (const s of allSentences()) expect(s.text, s.label).toMatch(/\{\{.+?\}\}/);
  });

  // Template subjects include names, so an object naming the same person gives "Ken called Ken."
  it('do not name the same person twice', () => {
    const pickers: Picker[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (items) => items[Math.min(i, items.length - 1)]!);
    for (const s of allSentences(pickers)) {
      const names = (s.text.replace(/\{\{|\}\}/g, '').match(/\b[A-Z][a-z]+\b/g) ?? []).filter((w) => w !== 'I');
      expect(new Set(names).size, `${s.label}: ${s.text}`).toBe(names.length);
    }
  });

  it('have an explanation', () => {
    for (const s of allSentences()) expect(s.reason, s.label).not.toBe('');
  });

  // The ing form alone may be left out, for verbs that are not used in the progressive.
  it.each(VERBS.map((v) => [v.base, v] as const))('%s can be asked in its base, s3, past and pp forms', (_, v) => {
    expect(askableKeys(v)).toEqual(expect.arrayContaining(['base', 's3', 'past', 'pp']));
  });
});

describe('templatesFor', () => {
  const src = { step: 1 as const, base: 'know', s3: 'knows', past: 'knew', pp: 'known', ing: 'knowing', ja: '知っている', obj: 'the answer' };
  const own = { text: '{{Ken}} ___ the answer.', reason: 'a state now' };

  it('uses the verb\'s own sentence in place of a template', () => {
    const v = buildVerb({ ...src, sentences: { 's3-present': own } });
    const [t] = templatesFor(v, 's3');
    expect(t?.id).toBe('s3-present');
    expect(t?.make(v, first)).toEqual(own);
  });

  it('leaves out a template set to null', () => {
    const v = buildVerb({ ...src, sentences: { 'ing-progressive': null, 'base-present': null } });
    expect(templatesFor(v, 'ing')).toEqual([]);
    expect(templatesFor(v, 'base').map((t) => t.id)).not.toContain('base-present');
  });

  it('uses the shared templates when the verb has no sentences of its own', () => {
    const v = buildVerb(src);
    expect(templatesFor(v, 'base').map((t) => t.id)).toEqual([
      'base-present',
      'base-did-question',
      'base-does-question',
      'base-can',
    ]);
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
