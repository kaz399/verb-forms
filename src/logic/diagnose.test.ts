import { describe, expect, it } from 'vitest';
import { VERB_BY_BASE } from '../data/verbs';
import { diagnose, type Mistake } from './diagnose';
import type { FormKey } from './forms';

const verb = (base: string) => VERB_BY_BASE.get(base)!;
const mistakeOf = (base: string, key: FormKey, answer: string): Mistake | null => {
  const d = diagnose(verb(base), key, answer);
  return d.ok ? null : d.mistake;
};

describe('diagnose', () => {
  describe('correct answers', () => {
    it('accepts the exact form', () => {
      expect(diagnose(verb('go'), 'past', 'went')).toEqual({ ok: true });
    });

    it('ignores case and surrounding spaces', () => {
      expect(diagnose(verb('go'), 'past', '  Went ')).toEqual({ ok: true });
    });

    it('accepts an AAA verb whose forms are identical', () => {
      expect(diagnose(verb('cut'), 'pp', 'cut')).toEqual({ ok: true });
    });
  });

  describe('another form of the same verb', () => {
    it.each([
      ['go', 'past', 'gone', 'pp'],
      ['go', 'pp', 'went', 'past'],
      ['play', 's3', 'play', 'base'],
      ['play', 'base', 'plays', 's3'],
      ['eat', 'ing', 'eats', 's3'],
    ] as const)('%s: answering %s with "%s" is the %s', (base, key, answer, form) => {
      expect(mistakeOf(base, key, answer)).toEqual({ kind: 'other-form', form });
    });
  });

  describe('-ed on an irregular verb', () => {
    it.each([
      ['go', 'past', 'goed'],
      ['eat', 'pp', 'eated'],
      ['buy', 'past', 'buyed'],
      ['run', 'pp', 'runned'],
    ] as const)('%s %s "%s"', (base, key, answer) => {
      expect(mistakeOf(base, key, answer)).toEqual({ kind: 'irregular-ed' });
    });

    it('also detects base + d on an irregular verb ending in e', () => {
      expect(mistakeOf('take', 'past', 'taked')).toEqual({ kind: 'irregular-ed' });
    });
  });

  describe('regular -ed spelling', () => {
    it('y after a consonant becomes i', () => {
      expect(mistakeOf('study', 'past', 'studyed')).toEqual({ kind: 'ed-y-to-i' });
    });

    it('a short vowel + one consonant doubles the consonant', () => {
      expect(mistakeOf('stop', 'pp', 'stoped')).toEqual({ kind: 'ed-double-consonant' });
    });
  });

  describe('-ing spelling', () => {
    it('drops a final e', () => {
      expect(mistakeOf('make', 'ing', 'makeing')).toEqual({ kind: 'ing-drop-e' });
    });

    it('doubles the final consonant after a short vowel', () => {
      expect(mistakeOf('run', 'ing', 'runing')).toEqual({ kind: 'ing-double-consonant' });
    });
  });

  describe('3rd person singular spelling', () => {
    it.each([
      ['try', 'trys'],
      ['carry', 'carryes'],
    ])('y after a consonant becomes ies: %s "%s"', (base, answer) => {
      expect(mistakeOf(base, 's3', answer)).toEqual({ kind: 's3-y-to-i' });
    });

    it.each([
      ['watch', 'watchs'],
      ['go', 'gos'],
      ['do', 'dos'],
    ])('s, sh, ch, x, o take -es: %s "%s"', (base, answer) => {
      expect(mistakeOf(base, 's3', answer)).toEqual({ kind: 's3-es' });
    });

    it('have has a special form', () => {
      expect(mistakeOf('have', 's3', 'haves')).toEqual({ kind: 's3-irregular' });
    });
  });

  it('falls back to a spelling mistake for anything else', () => {
    expect(mistakeOf('write', 'pp', 'writen')).toEqual({ kind: 'spelling' });
  });
});
