// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { app, TABS, updateBadge, type Tab } from './app';
import { byId } from './html';
import { nextQuestion } from './practice';
import { renderReview } from './review';

export function showTab(tab: Tab): void {
  app.tab = tab;
  document
    .querySelectorAll<HTMLButtonElement>('nav button')
    .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  TABS.forEach((t) => (byId(`tab-${t}`).hidden = t !== tab));
  updateBadge();
  if (tab === 'review') renderReview();
  if (tab === 'practice' && !app.practice.q) nextQuestion();
}

export function initTabs(): void {
  document
    .querySelectorAll<HTMLButtonElement>('nav button')
    .forEach((b) => (b.onclick = () => showTab(b.dataset.tab as Tab)));
}
