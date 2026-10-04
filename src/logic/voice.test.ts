import { describe, expect, it } from 'vitest';
import {
  choosePlayfulVoice,
  chooseVoice,
  MAX_VOLUME,
  NATURAL_VOLUME_BESIDE_PLAYFUL,
  PLAYFUL_VOICE_CHANCE,
  voiceForUtterance,
} from './voice';

const voice = (name: string, lang = 'en-US') => ({ name, lang });

describe('chooseVoice', () => {
  it('skips novelty voices that come first in Chrome on macOS', () => {
    const voices = [voice('Albert'), voice('Bad News'), voice('ささやき声'), voice('Samantha'), voice('Google US English')];
    expect(chooseVoice(voices)?.name).toBe('Samantha');
  });

  it('prefers the local macOS voice over the network Google voice', () => {
    expect(chooseVoice([voice('Google US English'), voice('Samantha')])?.name).toBe('Samantha');
  });

  it('matches enhanced variants of a preferred voice', () => {
    expect(chooseVoice([voice('Samantha (Enhanced)')])?.name).toBe('Samantha (Enhanced)');
  });

  it('accepts the underscore language tag used by some platforms', () => {
    expect(chooseVoice([voice('Samantha', 'en_US')])?.name).toBe('Samantha');
  });

  it('picks a Windows voice', () => {
    const voices = [voice('Microsoft David - English (United States)'), voice('Microsoft Zira - English (United States)')];
    expect(chooseVoice(voices)?.name).toBe('Microsoft Zira - English (United States)');
  });

  it('ignores preferred names in other languages', () => {
    expect(chooseVoice([voice('Samantha', 'en-GB')])).toBeUndefined();
  });

  it('leaves the choice to the browser when no preferred voice exists', () => {
    expect(chooseVoice([voice('Albert'), voice('Kyoko', 'ja-JP')])).toBeUndefined();
    expect(chooseVoice([])).toBeUndefined();
  });
});

describe('choosePlayfulVoice', () => {
  it('finds the novelty voice among US English voices', () => {
    expect(choosePlayfulVoice([voice('Samantha'), voice('Albert')])?.name).toBe('Albert');
  });

  it('is undefined on systems without it', () => {
    expect(choosePlayfulVoice([voice('Samantha'), voice('Microsoft Zira')])).toBeUndefined();
  });

  it('ignores a voice of the same name in another language', () => {
    expect(choosePlayfulVoice([voice('Albert', 'en-GB')])).toBeUndefined();
  });
});

describe('voiceForUtterance', () => {
  const playful = { voice: 'playful', volume: MAX_VOLUME };
  const natural = { voice: 'natural', volume: NATURAL_VOLUME_BESIDE_PLAYFUL };

  it('uses the playful voice only when the roll is below the chance', () => {
    expect(voiceForUtterance('natural', 'playful', 0)).toEqual(playful);
    expect(voiceForUtterance('natural', 'playful', PLAYFUL_VOICE_CHANCE - 0.001)).toEqual(playful);
    expect(voiceForUtterance('natural', 'playful', PLAYFUL_VOICE_CHANCE)).toEqual(natural);
    expect(voiceForUtterance('natural', 'playful', 0.999)).toEqual(natural);
  });

  it('plays the playful voice louder than the natural one', () => {
    expect(playful.volume).toBeGreaterThan(natural.volume);
    expect(playful.volume).toBe(1);
  });

  it('keeps the natural voice at full volume when there is no playful one', () => {
    expect(voiceForUtterance('natural', undefined, 0)).toEqual({ voice: 'natural', volume: MAX_VOLUME });
    expect(voiceForUtterance('natural', undefined, 0.999)).toEqual({ voice: 'natural', volume: MAX_VOLUME });
  });

  it('uses the playful voice three times in ten', () => {
    const rolls = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const count = rolls.filter((r) => voiceForUtterance('natural', 'playful', r).voice === 'playful').length;
    expect(count).toBe(300);
  });
});
