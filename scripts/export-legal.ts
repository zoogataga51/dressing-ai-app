// Exporte les textes juridiques de l'appli en Markdown (docs/legal/), pour le site et les fiches des stores.
// node --experimental-strip-types scripts/export-legal.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRIVACY, TERMS } from '../src/data/legal.ts';

mkdirSync('docs/legal', { recursive: true });
for (const d of [PRIVACY, TERMS]) {
  const md = [`# ${d.title}`, `_Mise à jour : ${d.updated}_`, ...d.sections.map((s) => `## ${s.title}\n\n${s.body.join('\n\n')}`)].join('\n\n');
  writeFileSync(`docs/legal/${d.id}.md`, md.replace(/\n\n- /g, '\n- ') + '\n');
}
console.log('docs/legal/cgu.md et docs/legal/confidentialite.md écrits');
