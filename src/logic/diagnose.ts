// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { FORM_KEYS, type FormKey, type Verb } from './forms';

/** Why an answer was wrong. The UI turns each kind into an explanation for the learner. */
export type Mistake =
  /** The answer is a different form of the same verb. */
  | { kind: 'other-form'; form: FormKey }
  /** -ed was added to an irregular verb. */
  | { kind: 'irregular-ed' }
  /** "tryed" instead of "tried". */
  | { kind: 'ed-y-to-i' }
  /** "stoped" instead of "stopped". */
  | { kind: 'ed-double-consonant' }
  /** "useing" instead of "using". */
  | { kind: 'ing-drop-e' }
  /** "runing" instead of "running". */
  | { kind: 'ing-double-consonant' }
  /** "trys" instead of "tries". */
  | { kind: 's3-y-to-i' }
  /** "watchs" instead of "watches". */
  | { kind: 's3-es' }
  /** "haves" instead of "has". */
  | { kind: 's3-irregular' }
  | { kind: 'spelling' };

export type Diagnosis = { ok: true } | { ok: false; mistake: Mistake };

export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

const endsWithConsonantY = (word: string) => /[^aeiou]y$/.test(word);
const takesEs = (word: string) => /(s|sh|ch|x|o)$/.test(word);
const naiveEd = (word: string) => (word.endsWith('e') ? `${word}d` : `${word}ed`);

export function diagnose(v: Verb, key: FormKey, raw: string): Diagnosis {
  const answer = normalizeAnswer(raw);
  const base = v.base;
  if (answer === v[key]) return { ok: true };
  const wrong = (mistake: Mistake): Diagnosis => ({ ok: false, mistake });

  const other = FORM_KEYS.find((k) => k !== key && v[k] === answer);
  if (other) return wrong({ kind: 'other-form', form: other });

  const isPastOrPp = key === 'past' || key === 'pp';
  if (isPastOrPp && !v.regular && (answer.endsWith('ed') || answer === `${base}d`)) {
    return wrong({ kind: 'irregular-ed' });
  }
  if (isPastOrPp && (answer === `${base}ed` || answer === naiveEd(base))) {
    return wrong({ kind: endsWithConsonantY(base) ? 'ed-y-to-i' : 'ed-double-consonant' });
  }
  if (key === 'ing' && answer === `${base}ing`) {
    return wrong({ kind: base.endsWith('e') ? 'ing-drop-e' : 'ing-double-consonant' });
  }
  if (key === 's3' && (answer === `${base}s` || answer === `${base}es`)) {
    if (endsWithConsonantY(base)) return wrong({ kind: 's3-y-to-i' });
    if (takesEs(base)) return wrong({ kind: 's3-es' });
    return wrong({ kind: 's3-irregular' });
  }
  return wrong({ kind: 'spelling' });
}
