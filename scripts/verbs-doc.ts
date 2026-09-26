// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { FORM_KEYS, PATTERN_INFO, STEPS, type Verb } from '../src/logic/forms';
import { TEMPLATES, templatesFor, type Picker, type TemplateId } from '../src/logic/templates';

const TEMPLATE_LABEL: Record<TemplateId, string> = {
  'base-present': 'Base · present',
  'base-did-question': 'Base · did question',
  'base-does-question': 'Base · does question',
  'base-can': 'Base · after a modal',
  's3-present': '3rd person singular',
  'past-time': 'Past',
  'pp-perfect': 'Past participle · perfect',
  'pp-passive': 'Past participle · passive',
  'ing-progressive': 'ing · progressive',
};

// Shared templates pick a subject at random; the document shows one fixed choice, as the verb card does.
const pickSecond: Picker = (items) => items[Math.min(1, items.length - 1)]!;

const cell = (s: string) => s.replace(/\|/g, '\\|');

/** Fills the blank with the answer in bold and shows clue words in italics. */
function renderSentence(text: string, answer: string): string {
  return cell(text.replace('___', `**${answer}**`).replace(/\{\{(.+?)\}\}/g, '_$1_'));
}

function renderVerb(v: Verb): string {
  const rows = TEMPLATES.flatMap((t) => {
    if (!t.applies(v)) return [];
    const own = v.sentences[t.id];
    const label = TEMPLATE_LABEL[t.id];
    if (own === null) return [`| ${label} | — (not used) | |`];
    const [template] = templatesFor(v, t.key).filter((x) => x.id === t.id);
    const sentence = template!.make(v, pickSecond);
    const text = renderSentence(sentence.text, v[t.key]);
    return [own ? `| ${label} ★ | ${text} | ${cell(sentence.reason)} |` : `| ${label} | ${text} | |`];
  });
  const forms = FORM_KEYS.map((k) => v[k]).join(' / ');
  const lines = [
    `### ${v.base} — ${v.ja}`,
    '',
    `${forms}（${PATTERN_INFO[v.pattern].name}）`,
    '',
  ];
  if (v.note) lines.push(`Note on the card: ${v.note}`, '');
  lines.push('| Question | Sentence | Explanation (verb-specific sentences only) |', '|---|---|---|', ...rows, '');
  return lines.join('\n');
}

export function renderVerbsMarkdown(verbs: readonly Verb[]): string {
  const sections = STEPS.map((step) => {
    const inStep = verbs.filter((v) => v.step === step);
    const irregular = inStep.filter((v) => !v.regular).length;
    const summary = inStep
      .map((v) => `| ${v.base} | ${FORM_KEYS.map((k) => v[k]).join(' / ')} | ${PATTERN_INFO[v.pattern].name} | ${v.ja} |`)
      .join('\n');
    return [
      `## Step ${step} (${inStep.length} verbs: ${irregular} irregular, ${inStep.length - irregular} regular)`,
      '',
      '| Verb | Forms | Pattern | Meaning |',
      '|---|---|---|---|',
      summary,
      '',
      ...inStep.map(renderVerb),
    ].join('\n');
  });
  return [
    '# Verb list',
    '',
    '<!-- Generated from src/data/verbs.ts by `npm run docs:verbs`. Do not edit by hand. -->',
    '',
    `All ${verbs.length} verbs the app asks about, grouped by the step in which they are introduced,`,
    'with every sentence each verb can appear in.',
    '',
    '- **Bold** is the answer and _italics_ mark the clue words that tell which form to use.',
    '- ★ marks a sentence written for that verb; the others come from shared templates.',
    '- Shared templates choose the subject and time at random; one choice is shown here.',
    '- "— (not used)" means the verb is never asked with that template, usually because it sounds unnatural.',
    '',
    ...sections,
  ].join('\n');
}
