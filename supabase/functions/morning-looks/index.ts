// Fonction serveur : prépare les looks du matin AVANT le réveil, pour qu'ils s'affichent instantanément.
//
// Appelée toutes les 15 minutes par la base (pg_cron, migration 0004). Pour chaque personne dont l'heure de
// notification arrive dans les 45 prochaines minutes (dans son fuseau), avec un essai ou un abonnement actif et
// une garde-robe suffisante : météo de sa ville + composition des looks (humeur « libre »).
//
// Sans risque si quelqu'un l'appelle à la main : une personne déjà servie aujourd'hui est ignorée (aucun coût en
// plus), et les plafonds par personne de generate-outfits s'appliquent. Donc pas de jeton exigé (verify_jwt false).

import { generateForUser, hasAccess, MORNING_MODELS } from '../_shared/generate.ts';
import { adminClient, json } from '../_shared/server.ts';
import { geocode, todayWeather } from '../_shared/weather.ts';

const WINDOW_MIN = 45;
const MAX_PER_RUN = 25; // ~5 s par personne avec Flash : reste sous la limite de durée d'une fonction

/** Heure et date locales d'un fuseau, sans bibliothèque. */
function localNow(tz: string): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

Deno.serve(async () => {
  const admin = adminClient();
  const { data: profiles } = await admin.from('profiles')
    .select('id, city, latitude, longitude, timezone, notification_time, trial_started_at, premium_until, created_at')
    .not('onboarded_at', 'is', null);

  const due = (profiles ?? []).filter((p) => {
    if (!hasAccess(p)) return false;
    const { minutes } = localNow(p.timezone || 'Europe/Paris');
    const [h, m] = String(p.notification_time ?? '07:30').split(':').map(Number);
    const delta = (h * 60 + m - minutes + 1440) % 1440;
    return delta <= WINDOW_MIN;
  });

  const done: Record<string, string> = {};
  for (const p of due.slice(0, MAX_PER_RUN)) {
    const tz = p.timezone || 'Europe/Paris';
    const { day } = localNow(tz);
    const { count } = await admin.from('outfits').select('id', { count: 'exact', head: true })
      .eq('user_id', p.id).eq('for_date', day).eq('source', 'ai').eq('mood', 'free');
    if (count) { done[p.id] = 'déjà prêt'; continue; }

    let { latitude: lat, longitude: lon } = p;
    if (lat == null || lon == null) {
      const g = await geocode(p.city || 'Paris').catch(() => null);
      if (!g) { done[p.id] = 'ville inconnue'; continue; }
      lat = g.lat; lon = g.lon;
      await admin.from('profiles').update({ latitude: lat, longitude: lon, timezone: g.timezone }).eq('id', p.id);
    }
    const weather = await todayWeather(lat, lon, p.city ?? undefined).catch(() => null);
    if (!weather) { done[p.id] = 'météo indisponible'; continue; }
    const r = await generateForUser(admin, p.id, { mood: 'free', weather, day, models: MORNING_MODELS, timeoutMs: 40_000 });
    done[p.id] = r.outfits.length ? `${r.outfits.length} looks` : r.reason ?? 'aucun look';
  }
  return json({ candidates: due.length, done });
});
