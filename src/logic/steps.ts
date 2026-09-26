// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { STEPS, type Step, type Verb } from './forms';

/** Number of recent answers on random questions that decide whether to move on. */
export const ADVANCE_WINDOW = 40;
/** Correct answers needed within the window: 80%. */
export const ADVANCE_CORRECT = 32;

const LAST_STEP = STEPS[STEPS.length - 1]!;

/**
 * Where the learner is. Counting recent answers rather than days keeps the decision
 * independent of the device clock.
 */
export type StepProgress = {
  step: Step;
  /** Results of the latest random-question answers in this step, oldest first, at most ADVANCE_WINDOW. */
  recent: boolean[];
};

export const INITIAL_STEP_PROGRESS: StepProgress = { step: 1, recent: [] };

export const isLastStep = (step: Step) => step === LAST_STEP;

export const nextStep = (step: Step): Step | null => (isLastStep(step) ? null : ((step + 1) as Step));

/**
 * Records an answer to a random question. The learner moves on to the next step, and never back,
 * once the window is full and holds enough correct answers.
 */
export function recordStepAnswer(progress: StepProgress, correct: boolean): { progress: StepProgress; advanced: boolean } {
  if (isLastStep(progress.step)) return { progress, advanced: false };
  const recent = [...progress.recent, correct].slice(-ADVANCE_WINDOW);
  const ready = recent.length === ADVANCE_WINDOW && recent.filter(Boolean).length >= ADVANCE_CORRECT;
  if (!ready) return { progress: { ...progress, recent }, advanced: false };
  return { progress: { step: nextStep(progress.step)!, recent: [] }, advanced: true };
}

/** Verbs available at the given step: its own and those of earlier steps. */
export const verbsUpTo = (verbs: readonly Verb[], step: Step) => verbs.filter((v) => v.step <= step);

/** Verbs introduced at exactly the given step. */
export const verbsOf = (verbs: readonly Verb[], step: Step) => verbs.filter((v) => v.step === step);

// ---------- persistence ----------

export const STEP_DATA_VERSION = 1;

export type StepData = { version: typeof STEP_DATA_VERSION } & StepProgress;

export const toStepData = (p: StepProgress): StepData => ({ version: STEP_DATA_VERSION, ...p });

export function parseStepData(raw: unknown): StepProgress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { version, step, recent } = raw as Record<string, unknown>;
  if (version !== STEP_DATA_VERSION || !STEPS.includes(step as Step)) return null;
  if (!Array.isArray(recent) || !recent.every((r) => typeof r === 'boolean')) return null;
  return { step: step as Step, recent: recent.slice(-ADVANCE_WINDOW) };
}
