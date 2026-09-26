// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

// Explanations shown after an answer. Shared by the sentence templates and by verbs with sentences
// of their own, so that the same grammar point is always explained in the same words.

/** Meanings of the present perfect, named after the categories taught in junior high school. */
export const PERFECT_MEANING = {
  completion: '「もう〜した」「ちょうど〜したところ」',
  continuation: '「ずっと〜している」',
  experience: '「〜したことがある」',
  neverExperienced: '「一度も〜したことがない」',
  notSince: '「ずっと〜していない」',
} as const;

export const reasons = {
  notThirdPerson: (subject: string) =>
    `主語が「${subject}」なので3人称単数ではありません。現在の文でも -s は付けず、原形のままです。`,
  didQuestion: 'Did の疑問文では「過去」の意味を did が受け持つので、動詞は原形にもどります。',
  doesQuestion: 'Does の疑問文では「3単現」の意味を does が受け持つので、動詞は原形にもどります。',
  modal: (modal: string) => `${modal} などの助動詞のあとは、いつでも原形です。`,
  thirdPersonHabit: (subject: string, clue = 'every day', gloss = 'いつもすること') =>
    `主語が「${subject}」（3人称単数）で、${clue} は「${gloss}」なので現在形。だから -s（-es）が付きます。`,
  thirdPersonState: (subject: string) =>
    `主語が「${subject}」（3人称単数）で、今の状態を表す現在の文なので -s（-es）が付きます。`,
  pastTime: (clue: string) => `「${clue}」は過去を表す言葉なので、過去形を使います。`,
  perfect: (aux: string, meaning: string = PERFECT_MEANING.completion) =>
    `${aux} ＋ 過去分詞で${meaning}（現在完了）。have / has のあとは過去分詞です。`,
  passive: 'be動詞 ＋ 過去分詞で「〜される」「〜された」（受け身）。',
  progressive: (be: string, clue = 'now') => `be動詞（${be}）＋ ing形で「〜しているところ」（進行形）。${clue} もヒントです。`,
};
