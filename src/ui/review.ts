// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERB_BY_BASE } from '../data/verbs';
import { daysBetween, localDate } from '../logic/date';
import { BOX_COUNT, dueItems, REVIEW_INTERVALS_DAYS, upcomingItems, type ReviewItem } from '../logic/review';
import { app, setReview } from './app';
import { byId, esc, formTag } from './html';
import { inDaysLabel, startPractice } from './practice';

const intervalLabel = (days: number) => (days === 1 ? '翌日' : `${days}日後`);

const LEAD =
  '練習で間違えた形がここにたまります。' +
  `間違えた日のうちにもう一度、そのあと${REVIEW_INTERVALS_DAYS.map(intervalLabel).join('・')}と間をあけて出題し、` +
  `${BOX_COUNT}回続けて正解すると「覚えた」になってリストから外れます。`;

function itemsHTML(items: readonly ReviewItem[], meta: (it: ReviewItem) => string): string {
  const dots = (box: number) =>
    Array.from({ length: BOX_COUNT }, (_, i) => `<i class="${i < box - 1 ? 'on' : ''}"></i>`).join('');
  return `<ul class="rv">${items
    .flatMap((it) => {
      const v = VERB_BY_BASE.get(it.base);
      if (!v) return [];
      return [
        `
      <li class="f-${it.key}">
        <span class="w">${v[it.key]}</span>
        ${formTag(it.key)}
        <span class="meta">${v.base}（${esc(v.ja)}）・${meta(it)}</span>
        <span class="dots" aria-label="${BOX_COUNT}回中 ${it.box - 1}回正解">${dots(it.box)}</span>
      </li>`,
      ];
    })
    .join('')}</ul>`;
}

export function renderReview(): void {
  byId('rvLead').textContent = LEAD;
  const area = byId('rvArea');
  const today = localDate(Date.now());
  const due = dueItems(app.review, today);
  const upcoming = upcomingItems(app.review, today);
  if (!due.length && !upcoming.length) {
    area.innerHTML = '<div class="empty">まだ間違えた問題はありません。「文で練習」で間違えると、ここに追加されます。</div>';
    return;
  }
  const dueSection = due.length
    ? `${itemsHTML(due, (it) => `まちがえた回数 ${it.miss}`)}
      <div class="actions"><button class="btn" id="startRv">今日の復習を始める（${due.length}問）</button></div>`
    : '<p class="lead">今日の復習はおわりです。</p>';
  const upcomingSection = upcoming.length
    ? `<h2 class="rv-h">これからの復習</h2>
      ${itemsHTML(upcoming, (it) => inDaysLabel(daysBetween(today, it.due)))}`
    : '';
  area.innerHTML = `
    <h2 class="rv-h">今日の復習</h2>
    ${dueSection}
    ${upcomingSection}
    <div class="actions"><button class="btn sub" id="clearRv">リストを空にする</button></div>`;
  const start = document.getElementById('startRv');
  if (start) start.onclick = () => startPractice({ range: 'review' });
  byId('clearRv').onclick = () => {
    if (confirm('復習リストを空にしますか？')) {
      setReview({});
      renderReview();
    }
  };
}
