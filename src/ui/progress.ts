// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERBS } from '../data/verbs';
import { localDate } from '../logic/date';
import type { Mistake } from '../logic/diagnose';
import { FORM_KEYS, LABEL, type FormKey } from '../logic/forms';
import {
  accuracyPercent,
  countMistakes,
  dailyTotals,
  PERIOD_DAYS,
  recentPeriods,
  tallyAnswers,
  type AnswerMode,
  type Period,
} from '../logic/stats';
import { ADVANCE_CORRECT, ADVANCE_WINDOW, nextStep, verbsUpTo } from '../logic/steps';
import { app } from './app';
import { esc, formTag } from './html';

/** The bar chart's scale never goes below this, so that a day with a few answers does not fill the chart. */
const MIN_CHART_SCALE = 10;
/** Leaves room above the tallest bar for its count. */
const MAX_BAR_PX = 96;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const PREVIOUS_LABEL = `前の${PERIOD_DAYS}日間`;

const MODE_LABEL: Record<AnswerMode, string> = { choose: '選んで答える', type: 'つづりを書く' };

const SPELLING_MISTAKE_LABEL: Record<Exclude<Mistake['kind'], 'other-form'>, string> = {
  'irregular-ed': '不規則動詞に -ed を付けた',
  'ed-y-to-i': '-ed の前で y を i に変え忘れた',
  'ed-double-consonant': '-ed の前で最後の文字を重ね忘れた',
  'ing-drop-e': '-ing の前で e を取り忘れた',
  'ing-double-consonant': '-ing の前で最後の文字を重ね忘れた',
  's3-y-to-i': '-es の前で y を i に変え忘れた',
  's3-es': '-s ではなく -es を付ける形',
  's3-irregular': '3単現の特別な形（has など）',
  spelling: 'そのほかのつづり',
};

function mistakeLabel(id: string): string {
  const confused = /^other-form:(\w+)>(\w+)$/.exec(id);
  if (confused) {
    const [, expected, answered] = confused;
    return `${LABEL[expected as FormKey]}のところに${LABEL[answered as FormKey]}を使った`;
  }
  return SPELLING_MISTAKE_LABEL[id as keyof typeof SPELLING_MISTAKE_LABEL] ?? id;
}

const rateText = (r: number | null) => (r === null ? '—' : `${r}%`);

function changeText(current: number | null, previous: number | null, unit: string): string {
  if (current === null || previous === null) return '';
  const d = current - previous;
  if (d === 0) return `${PREVIOUS_LABEL}と同じ`;
  return `${PREVIOUS_LABEL}より${d > 0 ? '+' : '−'}${Math.abs(d)}${unit}`;
}

function activityHTML(current: Period): string {
  const days = dailyTotals(app.stats, current);
  const total = days.reduce((n, d) => n + d.total, 0);
  const practiced = days.filter((d) => d.total > 0).length;
  const top = Math.max(MIN_CHART_SCALE, ...days.map((d) => d.total));
  const today = current.to;
  // Counts are printed on each bar instead of in hover tooltips, which touch screens cannot show.
  const bars = days
    .map(({ date, total: n }) => {
      const [, m, d] = date.split('-').map(Number);
      const weekday = WEEKDAYS[new Date(`${date}T00:00`).getDay()];
      const label = date === today ? '今日' : weekday;
      return `
        <div class="day" role="listitem" aria-label="${m}月${d}日（${weekday}） ${n}問">
          <span class="day-n">${n || ''}</span>
          <span class="day-bar" style="height:${Math.round((n / top) * MAX_BAR_PX)}px"></span>
          <span class="day-l">${label}</span>
        </div>`;
    })
    .join('');
  return `
    <div class="tile">
      <div class="tile-l">この${PERIOD_DAYS}日間</div>
      <div class="tile-v">${practiced}日・${total}問</div>
      <div class="days" role="list" aria-label="日ごとの問題数">${bars}</div>
    </div>`;
}

function randomAccuracyHTML(current: Period, previous: Period): string {
  const tiles = (['choose', 'type'] as const)
    .map((mode) => {
      const include = (c: { mode: AnswerMode; range: string }) => c.mode === mode && c.range === 'all';
      const now = tallyAnswers(app.stats, current, include);
      const before = tallyAnswers(app.stats, previous, include);
      const [r, p] = [accuracyPercent(now), accuracyPercent(before)];
      return `
        <div class="tile">
          <div class="tile-l">${MODE_LABEL[mode]}</div>
          <div class="tile-v">${rateText(r)}</div>
          <div class="tile-s">${now.correct} / ${now.total}問</div>
          <div class="tile-s">${changeText(r, p, '')}</div>
        </div>`;
    })
    .join('');
  return `<div class="tiles">${tiles}</div>`;
}

function formAccuracyHTML(current: Period, previous: Period): string {
  const rows = FORM_KEYS.map((key) => {
    const now = tallyAnswers(app.stats, current, (c) => c.key === key);
    const before = tallyAnswers(app.stats, previous, (c) => c.key === key);
    const [r, p] = [accuracyPercent(now), accuracyPercent(before)];
    return `
      <li class="f-${key}">
        ${formTag(key)}
        <span class="meter" aria-hidden="true"><span style="width:${r ?? 0}%"></span></span>
        <span class="acc-v">${rateText(r)}</span>
        <span class="acc-s">${now.total}問　${changeText(r, p, 'ポイント')}</span>
      </li>`;
  }).join('');
  return `<ul class="acc">${rows}</ul>`;
}

function mistakesHTML(current: Period, previous: Period): string {
  const now = countMistakes(app.stats, current);
  const before = countMistakes(app.stats, previous);
  const ids = Object.keys(now).sort((a, b) => now[b]! - now[a]!);
  // Kinds that disappeared this period are the clearest sign of progress, so list them too.
  const gone = Object.keys(before).filter((id) => !(id in now));
  if (!ids.length && !gone.length) return `<p class="lead">この${PERIOD_DAYS}日間の間違いはありません。</p>`;
  const row = (id: string) => `
      <li>
        <span class="mk-l">${esc(mistakeLabel(id))}</span>
        <span class="mk-v">${now[id] ?? 0}回</span>
        <span class="mk-s">${PREVIOUS_LABEL} ${before[id] ?? 0}回</span>
      </li>`;
  return `<ul class="mk">${[...ids, ...gone].map(row).join('')}</ul>`;
}

function stepHTML(): string {
  const { step, recent } = app.steps;
  const next = nextStep(step);
  const head = `
      <div class="tile-l">いまのステップ</div>
      <div class="tile-v">ステップ${step}（${verbsUpTo(VERBS, step).length}語）</div>`;
  if (!next) return `<div class="tile">${head}<div class="tile-s">最後のステップです。すべての動詞を練習しています。</div></div>`;
  const correct = recent.filter(Boolean).length;
  return `
    <div class="tile">
      ${head}
      <span class="meter" aria-hidden="true"><span style="width:${Math.min(100, (correct / ADVANCE_CORRECT) * 100)}%;background:var(--c-s3)"></span></span>
      <div class="tile-s">「すべての動詞」の直近${recent.length}問のうち正解 ${correct}問</div>
      <div class="tile-s">直近${ADVANCE_WINDOW}問で${ADVANCE_CORRECT}問正解すると、ステップ${next}に進みます。</div>
    </div>`;
}

export function progressHTML(): string {
  const { current, previous } = recentPeriods(localDate(Date.now()));
  if (tallyAnswers(app.stats, current).total === 0 && tallyAnswers(app.stats, previous).total === 0) {
    return `
      <h2 class="rv-h">学習の記録</h2>
      ${stepHTML()}
      <p class="lead">「文で練習」で問題を解くと、ここに記録が表示されます。</p>`;
  }
  return `
    <h2 class="rv-h">学習の記録</h2>
    ${stepHTML()}
    ${activityHTML(current)}
    <h3 class="pg-h">「すべての動詞」の正解率</h3>
    ${randomAccuracyHTML(current, previous)}
    <h3 class="pg-h">形ごとの正解率</h3>
    ${formAccuracyHTML(current, previous)}
    <h3 class="pg-h">間違いの種類（この${PERIOD_DAYS}日間）</h3>
    ${mistakesHTML(current, previous)}`;
}
