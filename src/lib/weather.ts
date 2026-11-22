/**
 * Météo du jour via Open-Meteo : gratuit, sans clé, sans compte.
 * https://open-meteo.com — usage non commercial gratuit ; offre payante peu chère au lancement
 * commercial (à prévoir dans le budget, voir docs/ARCHITECTURE.md).
 */
import type { Weather } from '@/types';

type GeoResult = { latitude: number; longitude: number; name: string };

const cache = new Map<string, { at: number; weather: Weather }>();

async function geocode(city: string): Promise<GeoResult | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
  if (!r.ok) return null;
  const j = (await r.json()) as { results?: GeoResult[] };
  return j.results?.[0] ?? null;
}

/** Codes météo WMO → nos trois icônes. */
function toCondition(code: number): Weather['condition'] {
  if (code <= 1) return 'sun';
  if (code >= 51) return 'rain';
  return 'cloud';
}

export async function getTodayWeather(city: string): Promise<Weather | null> {
  const key = city.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.weather;
  try {
    const geo = await geocode(city);
    if (!geo) return null;
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
        '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=1',
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_probability_max: number[] } };
    const max = j.daily.temperature_2m_max[0];
    const min = j.daily.temperature_2m_min[0];
    const rainy = (j.daily.precipitation_probability_max[0] ?? 0) >= 50;
    // On s'habille pour la journée : moyenne pondérée vers le minimum (le matin est plus frais).
    const weather: Weather = {
      city: geo.name,
      tempC: Math.round(min * 0.6 + max * 0.4),
      condition: rainy ? 'rain' : toCondition(j.daily.weather_code[0]),
    };
    cache.set(key, { at: Date.now(), weather });
    return weather;
  } catch {
    return null;
  }
}
