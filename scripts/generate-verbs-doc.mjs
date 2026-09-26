// Writes VERBS.md from the verb data. Vite loads the TypeScript sources, so no extra tooling is needed.
import { writeFile } from 'node:fs/promises';
import { runnerImport } from 'vite';

const { module: data } = await runnerImport('/src/data/verbs.ts');
const { module: doc } = await runnerImport('/scripts/verbs-doc.ts');
await writeFile(new URL('../VERBS.md', import.meta.url), doc.renderVerbsMarkdown(data.VERBS));
