import { describe, expect, it } from 'vitest';
import { VERBS, VERB_BY_BASE } from './verbs';

// Spelling rules taught in junior high school, written independently of the app code.
const VOWELS = 'aeiou';
const endsWithConsonantY = (w: string) => w.endsWith('y') && !VOWELS.includes(w.at(-2)!);
const vowelGroups = (w: string) => w.match(/[aeiou]+/g)?.length ?? 0;
// One-syllable words ending in a single vowel + a single consonant (not w, x, y) double the consonant.
const doublesFinal = (w: string) => vowelGroups(w) === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(w);

const S3_EXCEPTIONS: Record<string, string> = { have: 'has' };

function expectedS3(base: string): string {
  if (base in S3_EXCEPTIONS) return S3_EXCEPTIONS[base]!;
  if (endsWithConsonantY(base)) return `${base.slice(0, -1)}ies`;
  if (/(s|sh|ch|x|o)$/.test(base)) return `${base}es`;
  return `${base}s`;
}

function expectedIng(base: string): string {
  if (base.endsWith('e') && !base.endsWith('ee')) return `${base.slice(0, -1)}ing`;
  if (doublesFinal(base)) return `${base}${base.at(-1)}ing`;
  return `${base}ing`;
}

function expectedRegularPast(base: string): string {
  if (endsWithConsonantY(base)) return `${base.slice(0, -1)}ied`;
  if (base.endsWith('e')) return `${base}d`;
  if (doublesFinal(base)) return `${base}${base.at(-1)}ed`;
  return `${base}ed`;
}

describe('verb data', () => {
  it('has no duplicate base forms', () => {
    expect(VERB_BY_BASE.size).toBe(VERBS.length);
  });

  it.each(VERBS.map((v) => [v.base, v] as const))('%s: 3rd person singular follows the -s rules', (_, v) => {
    expect(v.s3).toBe(expectedS3(v.base));
  });

  it.each(VERBS.map((v) => [v.base, v] as const))('%s: ing form follows the -ing rules', (_, v) => {
    expect(v.ing).toBe(expectedIng(v.base));
  });

  it.each(VERBS.filter((v) => v.regular).map((v) => [v.base, v] as const))(
    '%s: regular past and past participle follow the -ed rules',
    (_, v) => {
      expect(v.past).toBe(expectedRegularPast(v.base));
      expect(v.pp).toBe(v.past);
    },
  );

  it.each(VERBS.filter((v) => v.passive).map((v) => [v.base, v] as const))(
    '%s: passive sentence has exactly one blank',
    (_, v) => {
      expect(v.passive!.split('___')).toHaveLength(2);
    },
  );
});
