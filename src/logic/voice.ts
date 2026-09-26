// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

export type VoiceLike = { name: string; lang: string };

// Leaving the voice to the browser is not enough: Chrome on macOS takes the first en-US voice,
// which is a novelty voice such as "Albert". Those voices cannot be excluded by name reliably
// because some names are localized (e.g. "ささやき声"), so natural voices are listed instead.
// Earlier entries win; names match by prefix to cover variants like "Samantha (Enhanced)".
const PREFERRED_VOICES = [
  'Samantha', // macOS, iOS
  'Microsoft Aria', // Windows
  'Microsoft Jenny',
  'Microsoft Zira',
  'Google US English', // Chrome; needs a network connection
] as const;

const isUsEnglish = (v: VoiceLike) => /^en[-_]US$/i.test(v.lang);

/** Picks a natural US English voice, or `undefined` to leave the choice to the browser. */
export function chooseVoice<V extends VoiceLike>(voices: readonly V[]): V | undefined {
  const candidates = voices.filter(isUsEnglish);
  for (const preferred of PREFERRED_VOICES) {
    const found = candidates.find((v) => v.name.startsWith(preferred));
    if (found) return found;
  }
  return undefined;
}
