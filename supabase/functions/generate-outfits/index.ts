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

import { generateForUser } from '../_shared/generate.ts';
import type { Mood, Weather } from '../_shared/outfits.ts';
import { adminClient, caller, cors, json } from '../_shared/server.ts';

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

  return json(await generateForUser(admin, user.id, { mood, weather, day }));
});
