// Fonction serveur : compose les 3 looks du jour avec l'IA (Gemini), à partir de la garde-robe,
// du profil de style, de la météo et de l'humeur.
//
// - Les règles du styliste et le contrôle qualité sont dans ../_shared/outfits.ts (testés sur de
//   fausses garde-robes avec scripts/looks-lab).
// - Chaque tenue renvoyée par l'IA est vérifiée : aucune pièce inventée, tenue complète, météo.
//   S'il en reste moins de 3, seconde chance en expliquant à l'IA ce qui a été refusé (../_shared/compose.ts).
// - Modèle : Gemini 3.5 Flash-Lite (rapide, ~0,1 c€), repli 3.1 Flash-Lite. Flash est limité à 20 requêtes/jour
//   sur l'offre gratuite et souvent saturé : à retester avec l'offre payante.
// - Même humeur le même jour → on renvoie les looks déjà créés (aucun coût en plus).
// - Plafond d'appels par jour et par personne pour tenir le coût (< 0,50 € par mois).
// - Si l'IA échoue, l'appli utilise son moteur par règles (réponse { outfits: [], fallback: true }).
//
// Secret nécessaire : GEMINI_API_KEY. SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont automatiques.

import { composeOutfits } from '../_shared/compose.ts';
import { buildOutfitPrompt, type Mood, type WardrobeItem, type Weather } from '../_shared/outfits.ts';
import { adminClient, caller, callsToday, cors, json, logAiCall } from '../_shared/server.ts';

const MODELS = (Deno.env.get('GEMINI_OUTFIT_MODELS') ?? 'gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',');
const MAX_PER_DAY = 4;
const MOODS: Mood[] = ['free', 'cozy', 'chic', 'relaxed', 'sporty', 'bold'];
const DAY = 86_400_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = adminClient();
  const user = await caller(req, admin);
  if (!user) return json({ error: 'Non autorisé' }, 401);

  const body = await req.json().catch(() => ({}));
  const mood: Mood = MOODS.includes(body.mood) ? body.mood : 'free';
  const w = body.weather ?? {};
  const weather: Weather = {
    city: typeof w.city === 'string' ? w.city.slice(0, 60) : undefined,
    tempC: Number.isFinite(w.tempC) ? Math.round(w.tempC) : 12,
    minC: Number.isFinite(w.minC) ? Math.round(w.minC) : undefined,
    maxC: Number.isFinite(w.maxC) ? Math.round(w.maxC) : undefined,
    condition: ['sun', 'cloud', 'rain'].includes(w.condition) ? w.condition : 'cloud',
  };
  // Date du jour de la personne (envoyée par le téléphone), bornée à ±1 jour du serveur.
  const serverDay = new Date().toISOString().slice(0, 10);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(body.date) && Math.abs(Date.parse(body.date) - Date.parse(serverDay)) <= DAY ? body.date : serverDay;

  // 1. Déjà composés aujourd'hui pour cette humeur ? On les renvoie.
  const { data: existing } = await admin.from('outfits').select('id, name, vibe, tip, garment_ids, mood, status')
    .eq('user_id', user.id).eq('for_date', day).eq('source', 'ai').eq('mood', mood).neq('status', 'disliked').order('position');
  if (existing?.length) return json({ outfits: existing, cached: true });

  if ((await callsToday(admin, user.id, 'generate-outfits')) >= MAX_PER_DAY) return json({ outfits: [], fallback: true, reason: 'limite' });
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ outfits: [], fallback: true, reason: 'ia' });

  // 2. Contexte : profil, garde-robe, ce qui a été porté ou refusé récemment.
  const since = new Date(Date.parse(day) - 60 * DAY).toISOString().slice(0, 10);
  const [{ data: profile }, { data: garments }, { data: past }] = await Promise.all([
    admin.from('profiles').select('answers, styles').eq('id', user.id).maybeSingle(),
    admin.from('garments').select('id, category, subtype, label, color_name, fit, material, seasons, warmth, formality, pattern')
      .eq('user_id', user.id).eq('archived', false),
    admin.from('outfits').select('for_date, name, garment_ids, status').eq('user_id', user.id).gte('for_date', since).in('status', ['worn', 'disliked'])
      .order('for_date', { ascending: false }).limit(60),
  ]);

  const lastWorn = new Map<string, string>();
  for (const o of past ?? []) if (o.status === 'worn') for (const id of o.garment_ids) if (!lastWorn.has(id)) lastWorn.set(id, o.for_date);
  const daysSince = (id: string) => (lastWorn.has(id) ? Math.round((Date.parse(day) - Date.parse(lastWorn.get(id)!)) / DAY) : null);

  const all: WardrobeItem[] = (garments ?? []).map((g) => ({ ...g, days_since_worn: daysSince(g.id) }));
  // Pièces portées ces 2 derniers jours mises de côté… sauf si la garde-robe devient trop petite.
  const rested = all.filter((g) => g.category === 'accessory' || (g.days_since_worn ?? 99) > 2);
  const enough = (list: WardrobeItem[]) => list.some((g) => g.category === 'shoes') &&
    (list.some((g) => g.category === 'dress') || (list.some((g) => g.category === 'top') && list.some((g) => g.category === 'bottom')));
  const available = enough(rested) ? rested : all;
  if (!enough(available)) return json({ outfits: [], fallback: true, reason: 'garde-robe' });

  const label = new Map(all.map((g) => [g.id, g.label]));
  const describe = (ids: string[]) => ids.map((id) => label.get(id)).filter(Boolean).join(' + ');
  const recentOutfits = (past ?? []).filter((o) => o.status === 'worn').slice(0, 7).map((o) => `${o.for_date} : ${describe(o.garment_ids)}`);
  const disliked = (past ?? []).filter((o) => o.status === 'disliked').slice(0, 8).map((o) => describe(o.garment_ids));

  const prompt = buildOutfitPrompt({ wardrobe: available, answers: profile?.answers ?? {}, styles: profile?.styles ?? [], weather, mood, recentOutfits, disliked });

  // 3. Appel à l'IA, contrôle qualité, enregistrement.
  try {
    const r = await composeOutfits({ apiKey, models: MODELS, prompt, wardrobe: available, weather, thinking: 'low', timeoutMs: 15_000 });
    const ok = r.ok;
    await logAiCall(admin, user.id, {
      fn: 'generate-outfits', model: r.model, tokens_in: r.tokensIn, tokens_out: r.tokensOut, cost_eur: r.costEur, ms: r.ms,
      attempts: r.attempts, proposed: r.proposed, kept: ok.length, rejected: r.rejected,
    });
    if (!ok.length) return json({ outfits: [], fallback: true, reason: 'qualité' });

    const { data: saved, error } = await admin.from('outfits').insert(ok.map((o, i) => ({
      user_id: user.id, for_date: day, position: i + 1, name: o.name, vibe: o.vibe, tip: o.tip, mood, weather,
      garment_ids: o.garment_ids, source: 'ai', ai_cost_eur: Number((r.costEur / ok.length).toFixed(5)),
    }))).select('id, name, vibe, tip, garment_ids, mood, status');
    if (error) return json({ outfits: ok.map((o, i) => ({ id: `tmp-${i}`, ...o, mood, status: 'proposed' })) });
    return json({ outfits: saved });
  } catch (e) {
    await logAiCall(admin, user.id, { fn: 'generate-outfits', error: String(e).slice(0, 200) });
    return json({ outfits: [], fallback: true, reason: 'ia' });
  }
});
