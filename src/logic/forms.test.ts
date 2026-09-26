import { describe, expect, it } from 'vitest';
import { buildVerb, classifyPattern } from './forms';

describe('classifyPattern', () => {
  it.each([
    ['play', 'played', 'played', 'REG'],
    ['cut', 'cut', 'cut', 'AAA'],
    ['make', 'made', 'made', 'ABB'],
    ['come', 'came', 'come', 'ABA'],
    ['go', 'went', 'gone', 'ABC'],
  ] as const)('%s / %s / %s is %s', (base, past, pp, pattern) => {
    expect(classifyPattern({ base, past, pp })).toBe(pattern);
  });
});

describe('buildVerb', () => {
  const src = { base: 'go', s3: 'goes', past: 'went', pp: 'gone', ing: 'going', ja: '行く', obj: 'home' };

  it('fills optional fields with defaults', () => {
    expect(buildVerb(src)).toMatchObject({ passive: null, sentences: {}, note: '' });
  });

  it('marks only -ed verbs as regular', () => {
    expect(buildVerb(src).regular).toBe(false);
    expect(buildVerb({ ...src, base: 'play', past: 'played', pp: 'played' }).regular).toBe(true);
  });
});
