// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERB_BY_BASE, VERBS } from '../data/verbs';
import { diagnose, normalizeAnswer } from '../logic/diagnose';
import {
  choiceOptions,
  nextQuestion as pickNextQuestion,
  randomPick,
  type Question,
  type QuestionSource,
} from '../logic/question';
import { recordAnswer, STREAK_TO_CLEAR, type ReviewChange } from '../logic/review';
import { app, setReview, type PracticeState } from './app';
import { openCard } from './card';
import { explainMistake } from './feedback';
import { byId, esc, formTag, renderClues } from './html';
import { showTab } from './tabs';

const REVIEW_NOTES: Record<ReviewChange, string> = {
  added: 'この形を復習リストに入れました。',
  progressed: `復習リストの問題です。あと${STREAK_TO_CLEAR - 1}回正解でリストから外れます。`,
  cleared: `続けて${STREAK_TO_CLEAR}回正解したので、復習リストから外しました。`,
  none: '',
};

const state = app.practice;

function syncSegments(): void {
  document
    .querySelectorAll<HTMLButtonElement>('#modeSeg button')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  document
    .querySelectorAll<HTMLButtonElement>('#rangeSeg button')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === state.range)));
}

function questionSource(): QuestionSource {
  if (state.range === 'review') {
    return { kind: 'review', targets: Object.values(app.review), lookup: (b) => VERB_BY_BASE.get(b) };
  }
  const only = state.only ? VERB_BY_BASE.get(state.only) : undefined;
  return only ? { kind: 'verb', verb: only } : { kind: 'all', verbs: VERBS };
}

export function nextQuestion(): void {
  state.answered = false;
  state.q = pickNextQuestion(questionSource(), randomPick);
  renderQuestion();
}

/** Opens the practice tab with a fresh question from the given range. */
export function startPractice(opts: { only: string } | { range: 'review' }): void {
  if ('only' in opts) {
    state.only = opts.only;
    state.range = 'all';
  } else {
    state.only = null;
    state.range = opts.range;
  }
  syncSegments();
  state.q = null;
  showTab('practice');
}

function sentenceHTML(q: Question, filled: boolean): string {
  const [before = '', after = ''] = q.text.split('___');
  const clue = (s: string) => renderClues(esc(s), (c) => `<span class="clue">${c}</span>`);
  const slot = filled
    ? `<span class="slot filled f-${q.key}">${esc(q.verb[q.key])}</span>`
    : '<span class="slot" aria-label="空欄">&nbsp;</span>';
  return clue(before) + slot + clue(after);
}

function renderScore(): void {
  byId('score').textContent = `正解 ${state.right} / ${state.total}`;
}

function renderQuestion(): void {
  const area = byId('qArea');
  renderScore();
  if (!state.q) {
    area.innerHTML = `<div class="q empty">復習リストは空です。<br>「すべての動詞」で練習して、間違えた形がここから出題されます。</div>`;
    return;
  }
  const v = state.q.verb;
  const onlyNote = state.only ? `　<button class="pill" id="clearOnly">${v.base} だけ練習中・解除</button>` : '';
  const input =
    state.mode === 'choose'
      ? `<div class="opts">${choiceOptions(v)
          .map((w) => `<button class="opt" data-w="${w}">${w}</button>`)
          .join('')}</div>`
      : `<div class="typing"><input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="空欄に入る形を書く" aria-label="答え"><button class="btn" id="submit">答える</button></div>`;
  area.innerHTML = `
    <div class="q" id="qbox">
      <div class="hint">動詞：<b>${v.base}</b>（${esc(v.ja)}）${onlyNote}</div>
      <p class="sent" id="sent">${sentenceHTML(state.q, false)}</p>
      ${input}
      <div id="fb"></div>
    </div>`;
  if (state.only)
    byId('clearOnly').onclick = () => {
      state.only = null;
      nextQuestion();
    };
  if (state.mode === 'choose') {
    area.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => (b.onclick = () => answer(b.dataset.w!)));
  } else {
    const input = byId<HTMLInputElement>('ans');
    input.focus();
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        answer(input.value);
      }
    };
    byId('submit').onclick = () => answer(input.value);
  }
}

function answer(raw: string): void {
  if (state.answered) return;
  if (!raw.trim()) {
    document.getElementById('ans')?.focus();
    return;
  }
  const q = state.q;
  if (!q) return;
  state.answered = true;
  const v = q.verb;
  const result = diagnose(v, q.key, raw);
  state.total++;
  if (result.ok) state.right++;
  renderScore();

  const recorded = recordAnswer(app.review, v.base, q.key, result.ok, Date.now());
  if (recorded.change !== 'none') setReview(recorded.list);
  const reviewNote = REVIEW_NOTES[recorded.change];

  const sentence = byId('sent');
  sentence.innerHTML = sentenceHTML(q, true);
  sentence.classList.add('revealed');
  document.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => {
    b.disabled = true;
    if (b.dataset.w === v[q.key]) b.classList.add('right');
    else if (b.dataset.w === raw) b.classList.add('wrong');
  });
  const input = document.getElementById('ans') as HTMLInputElement | null;
  if (input) input.disabled = true;
  const submit = document.getElementById('submit') as HTMLButtonElement | null;
  if (submit) submit.disabled = true;

  const items: string[] = [];
  if (!result.ok) {
    const { msg, tip } = explainMistake(v, q.key, normalizeAnswer(raw), result.mistake);
    items.push(msg);
    if (tip) items.push(tip);
  }
  items.push(`<span style="color:var(--muted)">この文のヒント：</span>${q.reason}`);
  byId('fb').innerHTML = `
    <div class="fb">
      <p class="verdict ${result.ok ? 'ok' : 'ng'}">${result.ok ? '正解！' : 'おしい！'}　${formTag(q.key)} <b class="f-${q.key}" style="color:var(--fc)">${v[q.key]}</b></p>
      <ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>
      ${reviewNote ? `<p class="score" style="margin:0">${reviewNote}</p>` : ''}
      <div class="actions">
        <button class="btn" id="next">次の問題</button>
        <button class="btn sub" id="toCard">${v.base} のカードを見る</button>
      </div>
    </div>`;
  const next = byId('next');
  next.focus();
  next.onclick = nextQuestion;
  byId('toCard').onclick = () => {
    openCard(v.base);
    showTab('card');
  };
}

export function initPractice(): void {
  document.querySelectorAll<HTMLButtonElement>('#modeSeg button').forEach(
    (b) =>
      (b.onclick = () => {
        state.mode = b.dataset.mode as PracticeState['mode'];
        syncSegments();
        // Re-rendering an answered question would let it be answered again, so move on instead.
        if (state.answered) nextQuestion();
        else renderQuestion();
      }),
  );
  document.querySelectorAll<HTMLButtonElement>('#rangeSeg button').forEach(
    (b) =>
      (b.onclick = () => {
        state.range = b.dataset.range as PracticeState['range'];
        state.only = null;
        syncSegments();
        nextQuestion();
      }),
  );
  // Lets keyboard users go on with Enter even after focus has left the "next" button.
  document.addEventListener('keydown', (e) => {
    if (app.tab === 'practice' && state.answered && e.key === 'Enter' && document.activeElement?.id !== 'next') {
      e.preventDefault();
      nextQuestion();
    }
  });
}
