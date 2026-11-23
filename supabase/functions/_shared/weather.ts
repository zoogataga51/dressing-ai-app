// Météo du jour côté serveur (Open-Meteo, gratuit, sans clé). Même calcul que l'appli (src/lib/weather.ts).
import type { Weather } from './outfits.ts';

export async function geocode(city: string): Promise<{ lat: number; lon: number; name: string; timezone: string } | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
  if (!r.ok) return null;
  const g = (await r.json()).results?.[0];
  return g ? { lat: g.latitude, lon: g.longitude, name: g.name, timezone: g.timezone ?? 'Europe/Paris' } : null;
}

export async function todayWeather(lat: number, lon: number, city?: string): Promise<Weather | null> {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=1');
  if (!r.ok) return null;
  const d = (await r.json()).daily;
  const max = d.temperature_2m_max[0], min = d.temperature_2m_min[0], code = d.weather_code[0];
  const rainy = (d.precipitation_probability_max[0] ?? 0) >= 50;
  return {
    city, tempC: Math.round(min * 0.6 + max * 0.4), minC: Math.round(min), maxC: Math.round(max),
    condition: rainy || code >= 51 ? 'rain' : code <= 1 ? 'sun' : 'cloud',
  };
}
