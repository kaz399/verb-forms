// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { LABEL, type FormKey } from '../logic/forms';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESCAPES[c]!);

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

export const formTag = (k: FormKey) => `<span class="tag f-${k}">${LABEL[k]}</span>`;

/** Replaces `{{clue}}` markers in already-escaped text. */
export const renderClues = (escaped: string, wrap: (clue: string) => string) =>
  escaped.replace(/\{\{(.+?)\}\}/g, (_, clue: string) => wrap(clue));
