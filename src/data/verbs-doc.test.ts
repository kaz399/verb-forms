import { describe, expect, it } from 'vitest';
import committed from '../../VERBS.md?raw';
import { renderVerbsMarkdown } from '../../scripts/verbs-doc';
import { VERBS } from './verbs';

describe('VERBS.md', () => {
  it('matches the verb data (run `npm run docs:verbs` after changing it)', () => {
    expect(committed).toBe(renderVerbsMarkdown(VERBS));
  });
});
