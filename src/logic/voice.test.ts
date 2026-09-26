import { describe, expect, it } from 'vitest';
import { chooseVoice } from './voice';

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
