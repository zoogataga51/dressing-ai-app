// Photos produit des vêtements de la garde-robe de démo (src/data/mock.ts), générées par IA.
// NODE_USE_ENV_PROXY=1 node --experimental-strip-types scripts/duel-images/demo-garments.ts <dossier brut>
import { mkdirSync, writeFileSync } from 'node:fs';
const ITEMS: [string, string][] = [
  ['g1', 'a loose beige chunky knit sweater'], ['g2', 'straight raw dark indigo denim jeans'], ['g3', 'a camel wool long coat'],
  ['g4', 'an oversized black sweatshirt'], ['g5', 'a pair of minimal white leather sneakers'], ['g6', 'khaki cargo trousers'],
  ['g7', 'an oversized light sky-blue cotton shirt'], ['g8', 'a blue baseball cap without logo'], ['g9', 'beige tailored trousers'],
  ['g10', 'an olive green puffer jacket'], ['g11', 'a pair of brown leather penny loafers'], ['g12', 'a plain white crew-neck t-shirt'],
  ['g13', 'a light sand-colored trench coat'], ['g14', 'a plum-colored folded viscose hijab scarf'], ['g15', 'a pair of grey suede sneakers'],
];
const out = process.argv[2] ?? 'demo-raw';
mkdirSync(out, { recursive: true });
async function one([id, what]: [string, string]) {
  const prompt = `Product photo of ${what}, alone, neatly laid flat and fully visible, centered with generous margins, on a plain warm off-white background (#F5F2EE), soft even daylight, subtle natural shadow, no person, no hanger, no logo, no text.`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? 'injectee-par-le-proxy' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } }),
    });
    const d = await r.json();
    const part = d.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData);
    if (part) { writeFileSync(`${out}/${id}.jpg`, Buffer.from(part.inlineData.data, 'base64')); return `${id} ok`; }
  }
  return `${id} ÉCHEC`;
}
for (let i = 0; i < ITEMS.length; i += 5) console.log((await Promise.all(ITEMS.slice(i, i + 5).map(one))).join(' · '));
