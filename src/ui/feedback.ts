// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { Mistake } from '../logic/diagnose';
import { PATTERN_INFO, type FormKey, type Verb } from '../logic/forms';
import { esc, formTag } from './html';

/** Extra hint for mixing up two forms, keyed by `${expected}>${answered}`. */
function confusionTip(v: Verb, expected: FormKey, answered: FormKey): string {
  const pair = `${expected}>${answered}`;
  if (pair === 'past>pp')
    return `過去分詞は have や be動詞 とセットで使う形で、1語だけで過去を表すことはできません。${v.base} の過去形は <b>${v.past}</b>、過去分詞は <b>${v.pp}</b> です。`;
  if (pair === 'pp>past')
    return `have / has や be動詞 のあとは、過去形ではなく過去分詞です。${v.base} の過去分詞は <b>${v.pp}</b> です。`;
  if (pair === 's3>base') return '主語が3人称単数で現在の文のときは、-s を忘れずに付けます。';
  if (pair === 'base>s3') return '-s を付けるのは、主語が3人称単数で、ふつうの現在の文のときだけです。';
  if (pair === 'base>past') return 'did や can があるときは、動詞は形を変えずに原形を使います。';
  if (expected === 'ing') return 'be動詞のあとで「〜している」を表すのは ing形 です。';
  if (expected === 'past') return '過去の文なので、過去形に変える必要があります。';
  return '';
}

/** HTML explanation of a wrong answer: the main message and an optional tip. */
export function explainMistake(
  v: Verb,
  key: FormKey,
  answer: string,
  mistake: Mistake,
): { msg: string; tip: string } {
  const correct = `<b>${v[key]}</b>`;
  const only = (msg: string) => ({ msg, tip: '' });
  switch (mistake.kind) {
    case 'other-form':
      return {
        msg: `「${esc(answer)}」は ${v.base} の${formTag(mistake.form)}です。この文では${formTag(key)}を使います。`,
        tip: confusionTip(v, key, mistake.form),
      };
    case 'irregular-ed': {
      const p = PATTERN_INFO[v.pattern];
      return {
        msg: `${v.base} は<b>不規則動詞</b>なので -ed は付きません。${formTag(key)}は ${correct} です。`,
        tip: `${p.name}（${p.rule}）の仲間として覚えましょう。`,
      };
    }
    case 'ed-y-to-i':
      return only(`「子音字＋y」で終わる動詞は、y を i に変えて -ed。正しくは ${correct} です。`);
    case 'ed-double-consonant':
      return only(`「短い母音＋子音字1つ」で終わる動詞は、最後の文字を重ねて -ed。正しくは ${correct} です。`);
    case 'ing-drop-e':
      return only(`e で終わる動詞は、e を取ってから -ing。正しくは ${correct} です。`);
    case 'ing-double-consonant':
      return only(`「短い母音＋子音字1つ」で終わる動詞は、最後の文字を重ねて -ing。正しくは ${correct} です。`);
    case 's3-y-to-i':
      return only(`「子音字＋y」で終わる動詞は、y を i に変えて -es。正しくは ${correct} です。`);
    case 's3-es':
      return only(`s・sh・ch・x・o で終わる動詞は -es を付けます。正しくは ${correct} です。`);
    case 's3-irregular':
      return only(`${v.base} の3単現は特別な形で ${correct} です。`);
    case 'spelling':
      return only(`正しくは ${correct} です。つづりをもう一度確かめましょう。`);
  }
}
