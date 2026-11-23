// Banc d'essai des looks : node --experimental-strip-types scripts/looks-lab/run.ts <modèle,repli> [réflexion]
// (dans l'environnement cloud, ajouter NODE_USE_ENV_PROXY=1 ; la clé est ajoutée par le proxy).
import { composeOutfits } from '../../supabase/functions/_shared/compose.ts';
import { buildOutfitPrompt } from '../../supabase/functions/_shared/outfits.ts';
import { CASES } from './wardrobes.ts';

const models = (process.argv[2] ?? 'gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',');
const thinking = (process.argv[3] ?? 'low') as 'minimal' | 'low' | 'medium' | 'high';
const apiKey = process.env.GEMINI_API_KEY ?? 'injectee-par-le-proxy';
let three = 0, kept = 0, cost = 0, ms = 0, errors = 0, retries = 0;
for (const c of CASES) {
  const prompt = buildOutfitPrompt({ wardrobe: c.wardrobe, answers: c.answers, styles: c.styles, weather: c.weather, mood: c.mood });
  try {
    const r = await composeOutfits({ apiKey, models, prompt, wardrobe: c.wardrobe, weather: c.weather, thinking, timeoutMs: 60_000 });
    kept += r.ok.length; cost += r.costEur; ms += r.ms; if (r.ok.length >= 3) three++; if (r.attempts > 1) retries++;
    const label = new Map(c.wardrobe.map((g) => [g.id, g.label]));
    console.log(`\n## ${c.name} — ${r.model}, ${r.attempts} essai(s), ${r.ms} ms, ${(r.costEur * 100).toFixed(3)} c€`);
    for (const o of r.ok) console.log(`  ✔ ${o.name} : ${o.garment_ids.map((id) => label.get(id)).join(' + ')}\n      « ${o.vibe} » — ${o.tip}`);
    for (const x of r.rejected) console.log(`  ✘ ${x}`);
  } catch (e) { errors++; console.log(`\n## ${c.name} — ERREUR ${e}`); }
  await new Promise((r) => setTimeout(r, 4500)); // offre gratuite : 15 requêtes par minute
}
const n = CASES.length;
console.log(`\n${models.join('→')} (${thinking}) : ${three}/${n} cas avec 3 looks, ${kept} looks gardés, ${retries} 2e essais, ${errors} erreurs, ` +
  `coût moyen ${(cost / n * 100).toFixed(3)} c€, ${Math.round(ms / n)} ms en moyenne`);
