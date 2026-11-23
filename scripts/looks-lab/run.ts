// Banc d'essai des looks : node --experimental-strip-types scripts/looks-lab/run.ts <modèle> [réflexion]
// (dans l'environnement cloud, ajouter NODE_USE_ENV_PROXY=1 ; la clé est ajoutée par le proxy).
import { geminiJson } from '../../supabase/functions/_shared/gemini.ts';
import { buildOutfitPrompt, OUTFIT_SCHEMA, OUTFIT_SYSTEM, validateOutfits, type ProposedOutfit } from '../../supabase/functions/_shared/outfits.ts';
import { CASES } from './wardrobes.ts';

const model = process.argv[2] ?? 'gemini-3.5-flash-lite';
const thinking = (process.argv[3] ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';
const apiKey = process.env.GEMINI_API_KEY ?? 'injectee-par-le-proxy';
let total = 0, okCount = 0, cost = 0;
for (const c of CASES) {
  const prompt = buildOutfitPrompt({ wardrobe: c.wardrobe, answers: c.answers, styles: c.styles, weather: c.weather, mood: c.mood });
  try {
    const r = await geminiJson<{ outfits: ProposedOutfit[] }>({ apiKey, model, system: OUTFIT_SYSTEM, schema: OUTFIT_SCHEMA, parts: [{ text: prompt }], temperature: 0.8, thinking, timeoutMs: 60_000 });
    const { ok, rejected } = validateOutfits(r.data.outfits, c.wardrobe, c.weather);
    total += r.data.outfits.length; okCount += ok.length; cost += r.costEur;
    const label = new Map(c.wardrobe.map((g) => [g.id, g.label]));
    console.log(`\n## ${c.name} — ${r.ms} ms, ${r.tokensIn}+${r.tokensOut} jetons, ${(r.costEur * 100).toFixed(3)} c€`);
    for (const o of ok) console.log(`  ✔ ${o.name} : ${o.garment_ids.map((id) => label.get(id)).join(' + ')}\n      « ${o.vibe} » — ${o.tip}`);
    for (const x of rejected) console.log(`  ✘ ${x}`);
  } catch (e) { console.log(`\n## ${c.name} — ERREUR ${e}`); }
}
console.log(`\n${model} (${thinking}) : ${okCount}/${total} tenues valides, coût moyen ${(cost / CASES.length * 100).toFixed(3)} c€ par génération`);
