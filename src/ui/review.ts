// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERB_BY_BASE } from '../data/verbs';
import { sortForDisplay, STREAK_TO_CLEAR } from '../logic/review';
import { app, setReview } from './app';
import { byId, esc, formTag } from './html';
import { startPractice } from './practice';

export function renderReview(): void {
  const area = byId('rvArea');
  const items = sortForDisplay(app.review).flatMap((it) => {
    const verb = VERB_BY_BASE.get(it.base);
    return verb ? [{ ...it, verb }] : [];
  });
  if (!items.length) {
    area.innerHTML = '<div class="empty">まだ間違えた問題はありません。「文で練習」で間違えると、ここに追加されます。</div>';
    return;
  }
  const dots = (streak: number) =>
    Array.from({ length: STREAK_TO_CLEAR }, (_, i) => `<i class="${i < streak ? 'on' : ''}"></i>`).join('');
  area.innerHTML = `
    <ul class="rv">${items
      .map(
        ({ verb: v, key, miss, streak }) => `
      <li class="f-${key}">
        <span class="w">${v[key]}</span>
        ${formTag(key)}
        <span class="meta">${v.base}（${esc(v.ja)}）・まちがえた回数 ${miss}</span>
        <span class="dots" aria-label="連続正解 ${streak} / ${STREAK_TO_CLEAR}">${dots(streak)}</span>
      </li>`,
      )
      .join('')}</ul>
    <div class="actions">
      <button class="btn" id="startRv">復習を始める</button>
      <button class="btn sub" id="clearRv">リストを空にする</button>
    </div>`;
  byId('startRv').onclick = () => startPractice({ range: 'review' });
  byId('clearRv').onclick = () => {
    if (confirm('復習リストを空にしますか？')) {
      setReview({});
      renderReview();
    }
  };
}
