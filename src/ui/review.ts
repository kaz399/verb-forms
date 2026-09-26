// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERB_BY_BASE } from '../data/verbs';
import { daysBetween, localDate } from '../logic/date';
import { dueItems, MASTERED_BOX, REVIEW_INTERVALS_DAYS, upcomingItems, type ReviewItem } from '../logic/review';
import { app, setReview } from './app';
import { byId, esc, formTag } from './html';
import { inDaysLabel, startPractice } from './practice';
import { progressHTML } from './progress';

const intervalLabel = (days: number) => (days === 1 ? '翌日' : `${days}日後`);

const STEPS_TO_MASTER = MASTERED_BOX - 1;
const RECHECK_DAYS = REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1];

const LEAD =
  '練習で間違えた形がここにたまります。' +
  `間違えた日のうちにもう一度、そのあと${REVIEW_INTERVALS_DAYS.map(intervalLabel).join('・')}と間をあけて出題します。` +
  `${STEPS_TO_MASTER}回続けて正解すると「定着」になり、そのあとも${RECHECK_DAYS}日ごとに確かめます。`;

function itemsHTML(items: readonly ReviewItem[], meta: (it: ReviewItem) => string): string {
  const dots = (box: number) =>
    Array.from({ length: STEPS_TO_MASTER }, (_, i) => `<i class="${i < box - 1 ? 'on' : ''}"></i>`).join('');
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
        <span class="dots" aria-label="${STEPS_TO_MASTER}回中 ${it.box - 1}回正解">${dots(it.box)}</span>
      </li>`,
      ];
    })
    .join('')}</ul>`;
}

export function renderReview(): void {
  const area = byId('rvArea');
  const today = localDate(Date.now());
  const due = dueItems(app.review, today);
  const upcoming = upcomingItems(app.review, today);
  if (!due.length && !upcoming.length) {
    area.innerHTML = `
      ${progressHTML()}
      <h2 class="rv-h">今日の復習</h2>
      <p class="lead">${LEAD}</p>
      <div class="empty">まだ間違えた問題はありません。「文で練習」で間違えると、ここに追加されます。</div>`;
    return;
  }
  const dueSection = due.length
    ? `${itemsHTML(due, (it) => `まちがえた回数 ${it.miss}`)}
      <div class="actions"><button class="btn" id="startRv">今日の復習を始める（${due.length}問）</button></div>`
    : '<p class="lead">今日の復習はおわりです。</p>';
  const upcomingSection = upcoming.length
    ? `<h2 class="rv-h">これからの復習</h2>
      ${itemsHTML(upcoming, (it) => `${inDaysLabel(daysBetween(today, it.due))}${it.box === MASTERED_BOX ? '・定着' : ''}`)}`
    : '';
  const mastered = Object.values(app.review).filter((it) => it.box === MASTERED_BOX).length;
  area.innerHTML = `
    ${progressHTML()}
    <h2 class="rv-h">今日の復習</h2>
    <p class="lead">${LEAD}</p>
    <p class="lead">復習リスト ${due.length + upcoming.length}個・そのうち定着 ${mastered}個</p>
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
