// Génère les images des duels de looks (Gemini image) à partir des imagePrompt de src/data/duels.ts.
// NODE_USE_ENV_PROXY=1 node --experimental-strip-types scripts/duel-images/generate.ts [dossier brut] [--only id1,id2]
// Les images brutes (~700 Ko) sont ensuite réduites par resize.py dans assets/duels/ (~40 Ko chacune).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

// Copie des prompts (duels.ts importe des types de l'appli : on lit le fichier brut pour rester indépendant).
import { readFileSync } from 'node:fs';
const src = readFileSync('src/data/duels.ts', 'utf8');
const base = /const PROMPT_BASE =\s*'([^']*)' \+\s*'([^']*)';/.exec(src)!;
const PROMPT_BASE = base[1] + base[2];
const looks = [...src.matchAll(/look\('(\w+)',[^\n]*\n\s*'([^']+)'\)/g)].map((m) => ({ id: m[1], prompt: PROMPT_BASE + m[2] }));

const out = process.argv[2] ?? 'duel-images-raw';
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
mkdirSync(out, { recursive: true });
const MODEL = 'gemini-3.1-flash-image';

async function one(l: { id: string; prompt: string }): Promise<string> {
  const file = `${out}/${l.id}.jpg`;
  if (!only && existsSync(file)) return `${l.id} déjà là`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? 'injectee-par-le-proxy' },
      body: JSON.stringify({ contents: [{ parts: [{ text: l.prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } } }),
    });
    const d = await r.json();
    const part = d.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string } }) => p.inlineData);
    if (part) { writeFileSync(file, Buffer.from(part.inlineData.data, 'base64')); return `${l.id} ok`; }
    if (attempt === 3) return `${l.id} ÉCHEC ${d.error?.message ?? d.candidates?.[0]?.finishReason}`;
  }
  return l.id;
}

const todo = looks.filter((l) => !only || only.includes(l.id));
console.log(`${todo.length} images à générer`);
for (let i = 0; i < todo.length; i += 4) console.log((await Promise.all(todo.slice(i, i + 4).map(one))).join(' · '));
