// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { FormKey, Verb } from './logic/forms';

export const canSpeak = 'speechSynthesis' in window;

export function speak(v: Verb, key: FormKey): void {
  if (!canSpeak) return;
  // Speech engines read the past "read" like the present one, so spell out its pronunciation.
  const text = v.base === 'read' && (key === 'past' || key === 'pp') ? 'red' : v[key];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
