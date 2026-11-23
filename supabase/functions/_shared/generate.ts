// Cœur de la génération des looks d'une personne pour un jour donné.
// Utilisé par generate-outfits (à l'ouverture de l'appli) et morning-looks (préparation avant le réveil).

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { composeOutfits } from './compose.ts';
import { buildOutfitPrompt, type Mood, type WardrobeItem, type Weather } from './outfits.ts';
import { callsToday, logAiCall } from './server.ts';

const MODELS = (Deno.env.get('GEMINI_OUTFIT_MODELS') ?? 'gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',');
const MAX_PER_DAY = 4;
const DAY = 86_400_000;
export const TRIAL_DAYS = 7; // même règle que src/lib/access.ts

export type GenerateResult = {
  outfits: { id: string; name: string; vibe: string | null; tip: string | null; garment_ids: string[]; mood?: string; status?: string }[];
  cached?: boolean; fallback?: boolean; locked?: boolean; reason?: string;
};

/** Essai de 7 jours (depuis l'inscription) ou abonnement Premium en cours. */
export function hasAccess(p: { trial_started_at: string | null; premium_until: string | null; created_at: string } | null): boolean {
  if (!p) return false;
  if (p.premium_until && Date.parse(p.premium_until) > Date.now()) return true;
  return Date.now() <= Date.parse(p.trial_started_at ?? p.created_at) + TRIAL_DAYS * DAY;
}

export async function generateForUser(admin: SupabaseClient, userId: string, opts: { mood: Mood; weather: Weather; day: string }): Promise<GenerateResult> {
  const { mood, weather, day } = opts;
  const user = { id: userId }; // même écriture que dans les fonctions
  // 0. Essai de 7 jours (depuis l'inscription) ou abonnement Premium en cours ; sinon, plus de looks.
  const { data: billing } = await admin.from('profiles').select('trial_started_at, premium_until, created_at').eq('id', user.id).maybeSingle();
  if (!hasAccess(billing)) return ({ outfits: [], locked: true });

  // 1. Déjà composés aujourd'hui pour cette humeur ? On les renvoie.
  const { data: existing } = await admin.from('outfits').select('id, name, vibe, tip, garment_ids, mood, status')
    .eq('user_id', user.id).eq('for_date', day).eq('source', 'ai').eq('mood', mood).neq('status', 'disliked').order('position');
  if (existing?.length) return ({ outfits: existing, cached: true });

  if ((await callsToday(admin, user.id, 'generate-outfits')) >= MAX_PER_DAY) return ({ outfits: [], fallback: true, reason: 'limite' });
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return ({ outfits: [], fallback: true, reason: 'ia' });

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
  if (!enough(available)) return ({ outfits: [], fallback: true, reason: 'garde-robe' });

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
    if (!ok.length) return ({ outfits: [], fallback: true, reason: 'qualité' });

    const { data: saved, error } = await admin.from('outfits').insert(ok.map((o, i) => ({
      user_id: user.id, for_date: day, position: i + 1, name: o.name, vibe: o.vibe, tip: o.tip, mood, weather,
      garment_ids: o.garment_ids, source: 'ai', ai_cost_eur: Number((r.costEur / ok.length).toFixed(5)),
    }))).select('id, name, vibe, tip, garment_ids, mood, status');
    if (error) return ({ outfits: ok.map((o, i) => ({ id: `tmp-${i}`, ...o, mood, status: 'proposed' })) });
    return ({ outfits: saved });
  } catch (e) {
    await logAiCall(admin, user.id, { fn: 'generate-outfits', error: String(e).slice(0, 200) });
    return ({ outfits: [], fallback: true, reason: 'ia' });
  }
}
