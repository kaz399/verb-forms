// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { FormKey, Verb } from './forms';
import { reasons } from './reasons';

/** Chooses one item from a non-empty list. Injected so that sentence generation is testable. */
export type Picker = <T>(items: readonly T[]) => T;

/**
 * A sentence with a blank.
 * `text` uses `___` for the blank and `{{...}}` for clue words that tell which form to use.
 */
export type Sentence = { text: string; reason: string };

export type TemplateId =
  | 'base-present'
  | 'base-did-question'
  | 'base-does-question'
  | 'base-can'
  | 's3-present'
  | 'past-time'
  | 'pp-perfect'
  | 'pp-passive'
  | 'ing-progressive';

export type Template = {
  id: TemplateId;
  key: FormKey;
  applies: (v: Verb) => boolean;
  make: (v: Verb, pick: Picker) => Sentence;
};

const SUBJECTS_NON_3RD = ['I', 'We', 'They', 'You', 'My parents'] as const;
const SUBJECTS_3RD = ['He', 'She', 'Ken', 'My sister', 'Tom'] as const;
const PAST_TIMES = ['yesterday', 'last Sunday', 'two days ago', 'last night'] as const;
const PROPER_NOUNS = ['I', 'Ken', 'Tom', 'Mika'];

const PERFECT_SUBJECTS = [
  ['I', 'have', 'already'],
  ['Ken', 'has', 'just'],
  ['She', 'has', 'just'],
  ['We', 'have', 'already'],
] as const;

const PROGRESSIVE_SUBJECTS = [
  ['I', 'am'],
  ['He', 'is'],
  ['They', 'are'],
  ['My sister', 'is'],
  ['We', 'are'],
] as const;

/** Lower-cases a sentence-initial subject so that it can follow an auxiliary ("Does he ..."). */
const midSentence = (s: string) => (PROPER_NOUNS.includes(s) ? s : s.toLowerCase());

const always = () => true;

// Within each form, the first template is used for the example sentence on the verb card.
export const TEMPLATES: readonly Template[] = [
  {
    id: 'base-present',
    key: 'base',
    applies: always,
    make: (v, pick) => {
      const s = pick(SUBJECTS_NON_3RD);
      return {
        text: `{{${s}}} ___ ${v.obj} {{every day}}.`,
        reason: reasons.notThirdPerson(s),
      };
    },
  },
  {
    id: 'base-did-question',
    key: 'base',
    applies: always,
    make: (v) => ({
      text: `{{Did}} you ___ ${v.obj} yesterday?`,
      reason: reasons.didQuestion,
    }),
  },
  {
    id: 'base-does-question',
    key: 'base',
    applies: always,
    make: (v, pick) => {
      const s = pick(SUBJECTS_3RD);
      return {
        text: `{{Does}} ${midSentence(s)} ___ ${v.obj}?`,
        reason: reasons.doesQuestion,
      };
    },
  },
  {
    id: 'base-can',
    key: 'base',
    applies: always,
    make: (v, pick) => {
      const s = pick(SUBJECTS_3RD);
      return {
        text: `${s} {{can}} ___ ${v.obj}.`,
        reason: reasons.modal('can'),
      };
    },
  },
  {
    id: 's3-present',
    key: 's3',
    applies: always,
    make: (v, pick) => {
      const s = pick(SUBJECTS_3RD);
      return {
        text: `{{${s}}} ___ ${v.obj} {{every day}}.`,
        reason: reasons.thirdPersonHabit(s),
      };
    },
  },
  {
    id: 'past-time',
    key: 'past',
    applies: always,
    make: (v, pick) => {
      const s = pick([...SUBJECTS_NON_3RD, ...SUBJECTS_3RD]);
      const t = pick(PAST_TIMES);
      return {
        text: `${s} ___ ${v.obj} {{${t}}}.`,
        reason: reasons.pastTime(t),
      };
    },
  },
  {
    id: 'pp-perfect',
    key: 'pp',
    applies: always,
    make: (v, pick) => {
      const [s, aux, adv] = pick(PERFECT_SUBJECTS);
      return {
        text: `${s} {{${aux}}} ${adv} ___ ${v.obj}.`,
        reason: reasons.perfect(aux),
      };
    },
  },
  {
    id: 'pp-passive',
    key: 'pp',
    applies: (v) => v.passive !== null,
    make: (v) => ({
      text: v.passive ?? '',
      reason: reasons.passive,
    }),
  },
  {
    id: 'ing-progressive',
    key: 'ing',
    applies: always,
    make: (v, pick) => {
      const [s, be] = pick(PROGRESSIVE_SUBJECTS);
      return {
        text: `${s} {{${be}}} ___ ${v.obj} {{now}}.`,
        reason: reasons.progressive(be),
      };
    },
  },
];

/** Templates that can ask `key` of `v`, with the verb's own sentences in place of the shared ones. */
export function templatesFor(v: Verb, key: FormKey): Template[] {
  return TEMPLATES.flatMap((t) => {
    if (t.key !== key || !t.applies(v)) return [];
    const own = v.sentences[t.id];
    if (own === null) return [];
    return [own ? { ...t, make: () => own } : t];
  });
}
