/**
 * Moteur de looks « de secours », basé sur des règles.
 *
 * La version finale fera composer les looks par une IA (voir docs/ARCHITECTURE.md).
 * Ce moteur sert : 1) à tester l'appli dès maintenant ; 2) de filet de sécurité si l'IA
 * ne répond pas ; 3) à pré-filtrer les pièces envoyées à l'IA (moins de texte = moins cher).
 *
 * Règles appliquées (cahier des charges) :
 *  - tenue complète : haut + bas (ou robe) + chaussures, veste si besoin, accessoire si pertinent ;
 *  - adaptée à la météo (chaleur des pièces) ;
 *  - pas de pièce portée récemment ;
 *  - accord des couleurs (neutres + une seule couleur forte) ;
 *  - cohérence du niveau d'habillé selon l'humeur et entre les pièces (pas de mocassins habillés avec un sweat) ;
 *  - préférences de couverture respectées (voile dans chaque tenue, jambes couvertes).
 */
import { luminance } from './color';
import type { Garment, Mood, Outfit, Weather } from '@/types';

const NEUTRAL_HEX_DISTANCE = 40; // écart max entre R, G et B pour qu'une couleur soit « neutre »

function isNeutral(hex: string): boolean {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < NEUTRAL_HEX_DISTANCE || isBeigeOrBrown(r, g, b);
}

function isBeigeOrBrown(r: number, g: number, b: number): boolean {
  return r >= g && g >= b && r - b < 110; // camel, beige, sable, brun : se portent comme des neutres
}

function daysSince(date?: string): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

const MOOD_FORMALITY: Record<Mood, [number, number]> = {
  free: [1, 3], cozy: [1, 2], chic: [2, 3], relaxed: [1, 2], sporty: [1, 1], bold: [1, 3],
};

function targetWarmth(tempC: number): number {
  if (tempC <= 8) return 3;
  if (tempC <= 16) return 2;
  return 1;
}

function scoreGarment(g: Garment, ctx: { mood: Mood; tempC: number }): number {
  let s = 0;
  const recent = daysSince(g.lastWornAt);
  if (recent < 2) s -= 100; // porté hier ou aujourd'hui : exclu de fait
  else if (recent < 5) s -= 15;
  s -= g.wearCount * 0.8; // favorise les pièces moins portées
  const [fMin, fMax] = MOOD_FORMALITY[ctx.mood];
  if (g.formality < fMin || g.formality > fMax) s -= 12;
  const w = targetWarmth(ctx.tempC);
  if (g.category !== 'accessory' && g.category !== 'shoes') s -= Math.abs(g.warmth - w) * 6;
  if (ctx.mood === 'bold' && !isNeutral(g.colorHex)) s += 8;
  if (ctx.mood === 'cozy' && g.warmth === 3) s += 5;
  return s + Math.random() * 6; // un peu de variété
}

function colorsWork(pieces: Garment[]): boolean {
  const strong = pieces.filter((p) => !isNeutral(p.colorHex));
  if (strong.length > 1) return false; // une seule couleur forte par tenue
  const lums = pieces.map((p) => luminance(p.colorHex));
  return Math.max(...lums) - Math.min(...lums) > 0.08; // évite le tout-pareil terne
}

const NAMES: Record<Mood, string[]> = {
  free: ['Évidence', 'Le bon équilibre', 'Signature'],
  cozy: ['Cocon', 'Douceur', 'Week-end cosy'],
  chic: ['Casual chic', 'Élégance simple', 'Tiré à quatre épingles'],
  relaxed: ['Urbain', 'Easy', 'Sans prise de tête'],
  sporty: ['En mouvement', 'Athleisure', 'Prêt à bouger'],
  bold: ['Coup d’éclat', 'Audace', 'Point de couleur'],
};

const TIPS = [
  'Un haut neutre laisse briller une veste de couleur : c’est elle qui fait la tenue.',
  'Rentre légèrement le haut devant : la silhouette paraît tout de suite plus nette.',
  'Remonte un peu les manches : un détail qui change toute l’allure.',
  'Chaussures et ceinture dans la même famille de couleur : effet soigné garanti.',
  'Un seul point de couleur par tenue, le reste en neutres : c’est la règle la plus sûre.',
];

export type EnginePrefs = { wearsHijab?: boolean; coverLegs?: boolean };

/** Préférences utiles au moteur, tirées des réponses au questionnaire. */
export function prefsFromAnswers(answers: Record<string, string[]>): EnginePrefs {
  const coverage = answers['coverage'] ?? [];
  return { wearsHijab: coverage.includes('hijab') || (answers['accessories'] ?? []).includes('hijab'), coverLegs: coverage.includes('legs') };
}

const isVeil = (g: Garment) => /voile|hijab/i.test(g.subtype);
const SHORT_BOTTOM = /short|bermuda|mini/i;
/** Niveau d'habillé de la base (bas ou robe) : c'est lui qui donne le ton. */
const baseFormality = (base: Garment[]) => (base.find((p) => p.category === 'bottom' || p.category === 'dress') ?? base[0]).formality;
const fits = (g: Garment, level: number) => Math.abs(g.formality - level) <= 1;

/** Compose jusqu'à `count` looks différents à partir de la garde-robe. */
export function generateOutfits(wardrobe: Garment[], weather: Weather, mood: Mood, count = 3, prefs: EnginePrefs = {}): Outfit[] {
  const ctx = { mood, tempC: weather.tempC };
  const allowed = wardrobe.filter((g) => !(prefs.coverLegs && (g.category === 'bottom' || g.category === 'dress') && SHORT_BOTTOM.test(`${g.subtype} ${g.label}`)));
  const by = (cat: Garment['category']) =>
    allowed.filter((g) => g.category === cat).map((g) => ({ g, s: scoreGarment(g, ctx) })).sort((a, b) => b.s - a.s).map((x) => x.g);

  const tops = by('top'); const bottoms = by('bottom'); const dresses = by('dress');
  const shoes = by('shoes'); const outers = by('outer');
  const veils = by('accessory').filter(isVeil);
  const accs = by('accessory').filter((a) => !isVeil(a));
  const needsOuter = weather.tempC <= 15 || weather.condition === 'rain';

  const candidates: Garment[][] = [];
  for (const top of tops.slice(0, 4)) for (const bottom of bottoms.slice(0, 4)) {
    if (top.formality - bottom.formality >= 2 || bottom.formality - top.formality >= 2) continue; // chemise soie + jogging : non
    candidates.push([top, bottom]);
  }
  for (const dress of dresses.slice(0, 3)) candidates.push([dress]);

  const results: Outfit[] = [];
  const used = new Set<string>();
  for (const base of candidates) {
    if (results.length >= count) break;
    if (base.some((p) => used.has(p.id))) continue; // looks vraiment différents entre eux
    const level = baseFormality(base);
    // L'humeur passe avant la variété : pas de cargo un jour « chic », pas de tailleur un jour « sportif »
    // (sauf s'il n'y a rien d'autre à proposer).
    if (results.length && ((mood === 'chic' && level < 2) || (mood === 'sporty' && level > 2))) continue;
    const shoe = shoes.find((x) => fits(x, level) && colorsWork([...base, x])) ?? shoes.find((x) => colorsWork([...base, x]));
    if (!shoe) continue;
    const pieces = [...base, shoe];
    if (needsOuter) {
      // Par temps froid, la chaleur prime : une doudoune sur une tenue habillée vaut mieux que rien.
      const outer = outers.find((o) => !used.has(o.id) && fits(o, level) && colorsWork([...pieces, o]))
        ?? outers.find((o) => !used.has(o.id) && colorsWork([...pieces, o]));
      if (outer) pieces.push(outer);
    }
    if (prefs.wearsHijab && veils.length) {
      // Le voile est dans chaque tenue : on choisit celui qui s'accorde le mieux, quitte à le reprendre.
      pieces.push(veils.find((v) => colorsWork([...pieces, v])) ?? veils[0]);
    } else {
      const acc = accs.find((a) => !used.has(a.id) && fits(a, level) && !(mood === 'chic' && a.formality < 2) && colorsWork([...pieces, a]));
      if (acc && Math.random() > 0.5) pieces.push(acc);
    }
    if (!colorsWork(pieces.filter((p) => !isVeil(p)))) continue;
    pieces.forEach((p) => { if (!isVeil(p)) used.add(p.id); });
    const i = results.length;
    results.push({
      id: `gen-${Date.now()}-${i}`,
      name: NAMES[mood][i % NAMES[mood].length],
      vibe: needsOuter ? `Pensé pour ${weather.tempC}° à ${weather.city}` : 'Léger et facile pour aujourd’hui',
      garmentIds: pieces.map((p) => p.id),
      tip: TIPS[(new Date().getDate() + i) % TIPS.length],
      source: 'rules',
    });
  }
  return results;
}
