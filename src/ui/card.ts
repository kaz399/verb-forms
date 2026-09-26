// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { VERB_BY_BASE, VERBS } from '../data/verbs';
import { LABEL, LABEL_LONG, PATTERN_INFO, USAGE, type FormKey, type Pattern, type Verb } from '../logic/forms';
import { exampleSentence } from '../logic/question';
import { nextStep, verbsOf, verbsUpTo } from '../logic/steps';
import { canSpeak, speak } from '../speech';
import { app } from './app';
import { byId, esc, renderClues } from './html';
import { startPractice } from './practice';

const FILTERS: readonly [Pattern | 'ALL', string][] = [
  ['ALL', 'すべて'],
  ['REG', '規則'],
  ['AAA', 'AAA型'],
  ['ABB', 'ABB型'],
  ['ABA', 'ABA型'],
  ['ABC', 'ABC型'],
];

const CARD_FORMS = ['s3', 'past', 'pp', 'ing'] as const;

/** Splits `word` into the prefix shared with `base` and the changed tail, highlighting the tail. */
function diffWord(base: string, word: string): string {
  let i = 0;
  while (i < base.length && i < word.length && base[i] === word[i]) i++;
  if (i === word.length && word.length === base.length)
    return `<span>${esc(word)}</span><span class="chg" style="text-decoration-style:dotted">＝</span>`;
  return `<span>${esc(word.slice(0, i))}</span><span class="chg">${esc(word.slice(i))}</span>`;
}

function exampleHTML(v: Verb, key: FormKey): string {
  const sentence = exampleSentence(v, key);
  if (!sentence) return '';
  const filled = esc(sentence.text).replace('___', `<span class="hit">${esc(v[key])}</span>`);
  return renderClues(filled, (clue) => clue);
}

// On narrow screens the filter and verb rows scroll sideways, so redrawing a row must not
// throw the learner back to its start.
function renderRow(id: string, html: string): HTMLElement {
  const row = byId(id);
  const left = row.scrollLeft;
  row.innerHTML = html;
  row.scrollLeft = left;
  return row;
}

/** Scrolls the verb row so that the selected verb is visible, e.g. after opening a card from practice. */
function revealSelectedChip(): void {
  const row = byId('chips');
  const chip = row.querySelector<HTMLElement>('[aria-current="true"]');
  row.scrollLeft = chip ? chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2 : 0;
}

function renderFilters(): void {
  renderRow(
    'filters',
    FILTERS.map(
      ([k, label]) => `<button class="pill" data-f="${k}" aria-pressed="${app.filter === k}">${label}</button>`,
    ).join(''),
  );
  document.querySelectorAll<HTMLButtonElement>('#filters .pill').forEach(
    (b) =>
      (b.onclick = () => {
        app.filter = b.dataset.f as Pattern | 'ALL';
        renderFilters();
        renderChips();
        revealSelectedChip();
      }),
  );
}

function renderStepNote(): void {
  const { step } = app.steps;
  const available = verbsUpTo(VERBS, step).length;
  const next = nextStep(step);
  byId('stepNote').textContent = next
    ? `ステップ${step}：${available}語を練習中。ステップ${next}で${verbsOf(VERBS, next).length}語が登場します。`
    : `ステップ${step}：${available}語すべてを練習中です。`;
}

function renderChips(): void {
  const list = verbsUpTo(VERBS, app.steps.step).filter((v) => app.filter === 'ALL' || v.pattern === app.filter);
  renderRow(
    'chips',
    list
      .map((v) => `<button class="chip" data-v="${v.base}" aria-current="${v.base === app.selected}">${v.base}</button>`)
      .join(''),
  );
  document.querySelectorAll<HTMLButtonElement>('#chips .chip').forEach(
    (b) =>
      (b.onclick = () => {
        app.selected = b.dataset.v!;
        renderChips();
        renderCard();
      }),
  );
}

function renderCard(): void {
  const v = VERB_BY_BASE.get(app.selected)!;
  const sayButton = (k: FormKey) =>
    canSpeak ? `<button class="say" data-say="${k}" aria-label="${LABEL[k]}を読み上げる">🔊</button>` : '';
  const forms = CARD_FORMS.map(
    (k) => `
    <div class="form f-${k}">
      <div class="lab">${LABEL_LONG[k]}</div>
      <div class="w">${diffWord(v.base, v[k])}${sayButton(k)}</div>
      <p class="use">${USAGE[k]}</p>
      <p class="ex">${exampleHTML(v, k)}</p>
    </div>`,
  ).join('');
  const p = PATTERN_INFO[v.pattern];
  byId('cardArea').innerHTML = `
    <article class="card">
      <div class="head"><span class="big">${v.base}</span>${sayButton('base')}<span class="meaning">${esc(v.ja)}</span></div>
      <p class="ptn"><b>${p.name}</b>：${p.rule}　（${v.base} ／ ${v.past} ／ ${v.pp}）</p>
      ${v.note ? `<p class="note">${esc(v.note)}</p>` : ''}
      <div class="grid">${forms}</div>
      <div class="actions"><button class="btn" id="drillThis">この動詞で練習する</button></div>
    </article>`;
  document
    .querySelectorAll<HTMLButtonElement>('[data-say]')
    .forEach((b) => (b.onclick = () => speak(v, b.dataset.say as FormKey)));
  byId('drillThis').onclick = () => startPractice({ only: v.base });
}

/** Redraws the verb list, which grows when the learner reaches a new step. */
export function refreshVerbList(): void {
  renderChips();
  renderStepNote();
}

/** Shows the card of `base` with all filters cleared. */
export function openCard(base: string): void {
  app.selected = base;
  app.filter = 'ALL';
  renderFilters();
  renderChips();
  renderCard();
  revealSelectedChip();
}

export function initCard(): void {
  renderFilters();
  renderChips();
  renderStepNote();
  renderCard();
  revealSelectedChip();
}
