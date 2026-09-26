// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { FormKey, Verb } from './forms';

/** Chooses one item from a non-empty list. Injected so that sentence generation is testable. */
export type Picker = <T>(items: readonly T[]) => T;

/**
 * A sentence with a blank.
 * `text` uses `___` for the blank and `{{...}}` for clue words that tell which form to use.
 */
export type Sentence = { text: string; reason: string };

export type Template = {
  id: string;
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
        reason: `主語が「${s}」なので3人称単数ではありません。現在の文でも -s は付けず、原形のままです。`,
      };
    },
  },
  {
    id: 'base-did-question',
    key: 'base',
    applies: always,
    make: (v) => ({
      text: `{{Did}} you ___ ${v.obj} yesterday?`,
      reason: 'Did の疑問文では「過去」の意味を did が受け持つので、動詞は原形にもどります。',
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
        reason: 'Does の疑問文では「3単現」の意味を does が受け持つので、動詞は原形にもどります。',
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
        reason: 'can などの助動詞のあとは、いつでも原形です。',
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
        reason: `主語が「${s}」（3人称単数）で、every day は「いつもすること」なので現在形。だから -s（-es）が付きます。`,
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
        reason: `「${t}」は過去を表す言葉なので、過去形を使います。`,
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
        reason: `${aux} ＋ 過去分詞で「もう〜した」「ちょうど〜したところ」（現在完了）。have / has のあとは過去分詞です。`,
      };
    },
  },
  {
    id: 'pp-passive',
    key: 'pp',
    applies: (v) => v.passive !== null,
    make: (v) => ({
      text: v.passive ?? '',
      reason: 'be動詞 ＋ 過去分詞で「〜される」「〜された」（受け身）。',
    }),
  },
  {
    id: 'ing-progressive',
    key: 'ing',
    applies: (v) => !v.noIng,
    make: (v, pick) => {
      const [s, be] = pick(PROGRESSIVE_SUBJECTS);
      return {
        text: `${s} {{${be}}} ___ ${v.obj} {{now}}.`,
        reason: `be動詞（${be}）＋ ing形で「〜しているところ」（進行形）。now もヒントです。`,
      };
    },
  },
];

export function templatesFor(v: Verb, key: FormKey): Template[] {
  return TEMPLATES.filter((t) => t.key === key && t.applies(v));
}
