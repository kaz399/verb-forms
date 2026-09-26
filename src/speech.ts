// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import type { FormKey, Verb } from './logic/forms';
import { chooseVoice } from './logic/voice';

export const canSpeak = 'speechSynthesis' in window;

let voice: SpeechSynthesisVoice | undefined;

// Chrome returns an empty list until the voices have loaded, and only starts loading them on the
// first getVoices() call, so request the list at startup and pick again once it arrives.
function refreshVoice(): void {
  voice = chooseVoice(speechSynthesis.getVoices());
}
if (canSpeak) {
  refreshVoice();
  speechSynthesis.addEventListener('voiceschanged', refreshVoice);
}

export function speak(v: Verb, key: FormKey): void {
  if (!canSpeak) return;
  // Speech engines read the past "read" like the present one, so spell out its pronunciation.
  const text = v.base === 'read' && (key === 'past' || key === 'pp') ? 'red' : v[key];
  const utterance = new SpeechSynthesisUtterance(text);
  if (!voice) refreshVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'en-US';
  utterance.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
