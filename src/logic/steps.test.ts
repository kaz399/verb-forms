import { describe, expect, it } from 'vitest';
import { VERBS } from '../data/verbs';
import {
  ADVANCE_CORRECT,
  ADVANCE_WINDOW,
  INITIAL_STEP_PROGRESS,
  parseStepData,
  recordStepAnswer,
  STEP_DATA_VERSION,
  toStepData,
  verbsOf,
  verbsUpTo,
  type StepProgress,
} from './steps';

/** Records answers given as a string of 'o' (correct) and 'x' (wrong). */
function answer(start: StepProgress, results: string) {
  let progress = start;
  let advancedCount = 0;
  for (const r of results) {
    const out = recordStepAnswer(progress, r === 'o');
    progress = out.progress;
    if (out.advanced) advancedCount++;
  }
  return { progress, advancedCount };
}

const wrong = ADVANCE_WINDOW - ADVANCE_CORRECT;

describe('recordStepAnswer', () => {
  it(`moves on after ${ADVANCE_CORRECT} correct answers out of the last ${ADVANCE_WINDOW}`, () => {
    const { progress, advancedCount } = answer(INITIAL_STEP_PROGRESS, 'x'.repeat(wrong) + 'o'.repeat(ADVANCE_CORRECT));
    expect(advancedCount).toBe(1);
    expect(progress).toEqual({ step: 2, recent: [] });
  });

  it('does not move on with one correct answer too few', () => {
    const { progress, advancedCount } = answer(
      INITIAL_STEP_PROGRESS,
      'x'.repeat(wrong + 1) + 'o'.repeat(ADVANCE_CORRECT - 1),
    );
    expect(advancedCount).toBe(0);
    expect(progress.step).toBe(1);
    expect(progress.recent).toHaveLength(ADVANCE_WINDOW);
  });

  it(`waits for ${ADVANCE_WINDOW} answers even when all are correct`, () => {
    const { progress } = answer(INITIAL_STEP_PROGRESS, 'o'.repeat(ADVANCE_WINDOW - 1));
    expect(progress.step).toBe(1);
  });

  it('judges only the latest answers, so early mistakes are forgotten', () => {
    const { progress } = answer(INITIAL_STEP_PROGRESS, 'x'.repeat(100) + 'o'.repeat(ADVANCE_CORRECT) + 'x'.repeat(wrong));
    expect(progress.step).toBe(2);
  });

  it('starts counting afresh in the new step', () => {
    const { progress } = answer(INITIAL_STEP_PROGRESS, 'o'.repeat(ADVANCE_WINDOW) + 'o'.repeat(ADVANCE_WINDOW - 1));
    expect(progress).toEqual({ step: 2, recent: Array(ADVANCE_WINDOW - 1).fill(true) });
  });

  it('never goes back to an earlier step', () => {
    const { progress } = answer({ step: 2, recent: [] }, 'x'.repeat(200));
    expect(progress.step).toBe(2);
  });

  it('stays at the last step', () => {
    const { progress, advancedCount } = answer({ step: 3, recent: [] }, 'o'.repeat(200));
    expect(advancedCount).toBe(0);
    expect(progress).toEqual({ step: 3, recent: [] });
  });
});

describe('verbsUpTo and verbsOf', () => {
  it('make each step add verbs to the earlier ones', () => {
    expect(verbsUpTo(VERBS, 1)).toEqual(verbsOf(VERBS, 1));
    expect(verbsUpTo(VERBS, 2)).toHaveLength(verbsOf(VERBS, 1).length + verbsOf(VERBS, 2).length);
    expect(verbsUpTo(VERBS, 3)).toHaveLength(VERBS.length);
  });

  it('start with the verbs shown first on the card', () => {
    expect(verbsOf(VERBS, 1).map((v) => v.base)).toContain('go');
  });
});

describe('parseStepData', () => {
  it('reads back what toStepData writes', () => {
    const p: StepProgress = { step: 2, recent: [true, false, true] };
    expect(parseStepData(JSON.parse(JSON.stringify(toStepData(p))))).toEqual(p);
  });

  it.each([
    ['null', null],
    ['an unknown version', { version: STEP_DATA_VERSION + 1, step: 1, recent: [] }],
    ['an unknown step', { version: STEP_DATA_VERSION, step: 4, recent: [] }],
    ['results that are not booleans', { version: STEP_DATA_VERSION, step: 1, recent: [1, 0] }],
  ])('rejects %s', (_, data) => {
    expect(parseStepData(data)).toBeNull();
  });
});
