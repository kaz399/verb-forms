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

/** How often the playful voice replaces the natural one. */
export const PLAYFUL_VOICE_CHANCE = 0.3;

// Speech volume cannot go above 1, so the playful voice is made to stand out by turning the
// natural one down instead.
export const MAX_VOLUME = 1;
export const NATURAL_VOLUME_BESIDE_PLAYFUL = 0.5;

// A novelty voice of macOS, used now and then purely for fun. It is absent on other systems.
const PLAYFUL_VOICE = 'Albert';

export function choosePlayfulVoice<V extends VoiceLike>(voices: readonly V[]): V | undefined {
  return voices.find((v) => isUsEnglish(v) && v.name === PLAYFUL_VOICE);
}

/**
 * Chooses the voice and volume for one utterance: usually the natural voice, sometimes the playful one.
 * `roll` is a random number in [0, 1).
 */
export function voiceForUtterance<V>(
  natural: V | undefined,
  playful: V | undefined,
  roll: number,
): { voice: V | undefined; volume: number } {
  // Without a playful voice there is nothing to balance against, so the natural one stays at full volume.
  if (!playful) return { voice: natural, volume: MAX_VOLUME };
  return roll < PLAYFUL_VOICE_CHANCE
    ? { voice: playful, volume: MAX_VOLUME }
    : { voice: natural, volume: NATURAL_VOLUME_BESIDE_PLAYFUL };
}
