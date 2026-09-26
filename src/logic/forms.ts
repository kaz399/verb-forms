// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

export const FORM_KEYS = ['base', 's3', 'past', 'pp', 'ing'] as const;
export type FormKey = (typeof FORM_KEYS)[number];

export const LABEL: Record<FormKey, string> = {
  base: '原形',
  s3: '3単現',
  past: '過去形',
  pp: '過去分詞',
  ing: 'ing形',
};

export const LABEL_LONG: Record<FormKey, string> = {
  base: '原形',
  s3: '3人称単数現在（3単現）',
  past: '過去形',
  pp: '過去分詞',
  ing: 'ing形',
};

export const USAGE: Record<Exclude<FormKey, 'base'>, string> = {
  s3: '主語が he / she / it など（3人称単数）で、今のこと・いつものこと',
  past: '昨日・先週など、終わった過去のこと',
  pp: 'have / has ＋ 過去分詞（現在完了）、be動詞 ＋ 過去分詞（受け身）',
  ing: 'be動詞 ＋ ing形 で「〜しているところ」（進行形）',
};

export type Pattern = 'REG' | 'AAA' | 'ABB' | 'ABA' | 'ABC';

export const PATTERN_INFO: Record<Pattern, { name: string; rule: string }> = {
  REG: { name: '規則動詞', rule: '-ed を付けて過去形・過去分詞を作る' },
  AAA: { name: 'AAA型', rule: '原形・過去形・過去分詞が全部同じ' },
  ABB: { name: 'ABB型', rule: '過去形と過去分詞が同じ' },
  ABA: { name: 'ABA型', rule: '原形と過去分詞が同じ' },
  ABC: { name: 'ABC型', rule: '原形・過去形・過去分詞が全部ちがう' },
};

export type Verb = Record<FormKey, string> & {
  /** Japanese meaning. */
  ja: string;
  /** Words that follow the verb in generated sentences (object, place, etc.). */
  obj: string;
  /** Passive-voice sentence with `___` for the past participle, if the verb reads naturally in one. */
  passive: string | null;
  /** True when the verb is rarely used in the progressive form (e.g. "see"). */
  noIng: boolean;
  /** Extra note shown on the verb card. */
  note: string;
  regular: boolean;
  pattern: Pattern;
};

export type VerbSource = Omit<Verb, 'regular' | 'pattern' | 'passive' | 'noIng' | 'note'> &
  Partial<Pick<Verb, 'passive' | 'noIng' | 'note'>>;

export function classifyPattern(v: Record<'base' | 'past' | 'pp', string>): Pattern {
  if (v.past.endsWith('ed')) return 'REG';
  if (v.base === v.past && v.past === v.pp) return 'AAA';
  if (v.past === v.pp) return 'ABB';
  if (v.base === v.pp) return 'ABA';
  return 'ABC';
}

export function buildVerb(src: VerbSource): Verb {
  const pattern = classifyPattern(src);
  return {
    ...src,
    passive: src.passive ?? null,
    noIng: src.noIng ?? false,
    note: src.note ?? '',
    regular: pattern === 'REG',
    pattern,
  };
}
