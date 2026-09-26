// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { FORM_KEYS, type FormKey, type Verb } from './forms';
import { templatesFor, type Picker, type Sentence } from './templates';

export type Question = Sentence & { verb: Verb; key: FormKey };

export const randomPick: Picker = (items) => {
  if (items.length === 0) throw new RangeError('cannot pick from an empty list');
  return items[Math.floor(Math.random() * items.length)]!;
};

/** Fisher-Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Forms of the verb that at least one sentence template can ask about. */
export function askableKeys(v: Verb): FormKey[] {
  return FORM_KEYS.filter((k) => templatesFor(v, k).length > 0);
}

export function makeQuestion(v: Verb, key: FormKey, pick: Picker): Question {
  const sentence = pick(templatesFor(v, key)).make(v, pick);
  return { ...sentence, verb: v, key };
}

// The card must show the same sentence on every render, so choices are fixed rather than random.
// Taking the second candidate keeps the examples identical to those of the prototype.
const pickSecond: Picker = (items) => items[Math.min(1, items.length - 1)]!;

export function exampleSentence(v: Verb, key: FormKey): Sentence | null {
  const [template] = templatesFor(v, key);
  return template ? template.make(v, pickSecond) : null;
}

/** Answer choices for the multiple-choice mode: every distinct form of the verb, in random order. */
export function choiceOptions(v: Verb, random: () => number = Math.random): string[] {
  return shuffle([...new Set(FORM_KEYS.map((k) => v[k]))], random);
}

export type ReviewTarget = { base: string; key: FormKey };

export type QuestionSource =
  | { kind: 'all'; verbs: readonly Verb[] }
  | { kind: 'verb'; verb: Verb }
  | {
      kind: 'review';
      targets: readonly ReviewTarget[];
      lookup: (base: string) => Verb | undefined;
      /** The item just asked. A missed item is due again at once, and asking it right back only tests short-term memory. */
      avoid?: ReviewTarget;
    };

export function nextQuestion(source: QuestionSource, pick: Picker): Question | null {
  if (source.kind === 'review') {
    const candidates = source.targets.flatMap((t) => {
      const verb = source.lookup(t.base);
      return verb && templatesFor(verb, t.key).length > 0 ? [{ verb, key: t.key }] : [];
    });
    const { avoid } = source;
    const others = candidates.filter((c) => !(avoid && c.verb.base === avoid.base && c.key === avoid.key));
    const pool = others.length > 0 ? others : candidates;
    if (pool.length === 0) return null;
    const { verb, key } = pick(pool);
    return makeQuestion(verb, key, pick);
  }
  const verb = source.kind === 'verb' ? source.verb : pick(source.verbs);
  return makeQuestion(verb, pick(askableKeys(verb)), pick);
}
