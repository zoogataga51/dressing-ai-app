// Composition des looks du jour : consignes du styliste, format de réponse et contrôle qualité.
// Tout ici est indépendant de Supabase, pour pouvoir le tester sur de fausses garde-robes.

export type WardrobeItem = {
  id: string; category: string; subtype: string; label: string; color_name: string; color_hex?: string;
  fit: string; material: string | null; seasons: string[]; warmth: number; formality: number; pattern: string | null;
  wear_count?: number; days_since_worn?: number | null;
};

export type Weather = { city?: string; tempC: number; minC?: number; maxC?: number; condition: 'sun' | 'cloud' | 'rain' };
export type Mood = 'free' | 'cozy' | 'chic' | 'relaxed' | 'sporty' | 'bold';
export type ProposedOutfit = { name: string; vibe: string; tip: string; garment_ids: string[] };

export const OUTFIT_SYSTEM = `Tu es un styliste personnel exigeant, au goût sûr, qui compose chaque matin les tenues d'une personne UNIQUEMENT avec ses vêtements.
Règles impératives (une tenue qui en enfreint une est refusée) :
1. Tenue complète : exactement un bas + un ou deux hauts, OU une robe seule (jamais de haut par-dessus une robe ; un bas sous la robe seulement pour une tenue longue de type qamis, abaya, tunique ou caftan) ; toujours UNE paire de chaussures. Deux hauts seulement s'ils se superposent vraiment (chemise sous un pull, t-shirt sous un sweat ou une chemise ouverte).
2. Veste ou manteau (catégorie outer) obligatoire sous 15 °C ou s'il pleut, si la garde-robe en contient ; jamais au-dessus de 24 °C. Un seul.
3. Accessoires : 0 à 2, seulement s'ils servent la tenue. Le voile, s'il est dans la garde-robe d'une personne qui le porte, est présent dans CHAQUE tenue.
4. Respecte strictement les préférences de couverture (jamais d'exception).
5. Couleurs : au plus une couleur forte par tenue, le reste en neutres (noir, blanc, crème, beige, camel, gris, marine, bleu jean, kaki, marron) ou en camaïeu. Évite les couleurs que la personne n'aime pas. Pas deux imprimés différents ensemble ; un seul imprimé si elle les aime « avec modération », aucun si elle préfère l'uni.
6. Coupes : équilibre les volumes (ample en haut → plus net en bas, et inversement), sauf si la personne aime l'oversize.
7. Météo et saisons : chaleur des pièces adaptée (rien de léger sous 10 °C, pas de pièce chaude ni de bottines au-dessus de 20 °C, pas de sandales sous 18 °C). Utilise les pièces dans leurs saisons. Pluie : évite daim et toile claire aux pieds si possible.
8. Cohérence de formalité et d'usage : mélanger chic et décontracté est bienvenu (baskets et blazer, abaya et baskets), mais pas de contresens : pas d'escarpins ou de mocassins habillés avec un jogging, un short ou un legging, pas d'escarpins avec un sac banane.
9. Les 3 tenues sont nettement différentes : chacune a un bas ou une robe différent si possible, et des chaussures différentes si possible.
10. Fais tourner la garde-robe : favorise les pièces peu portées ou pas portées depuis longtemps.
Style : les 3 tenues respectent l'humeur du jour (une humeur « chic » = 3 tenues chics, pas de short ni de casquette si la garde-robe permet mieux) et le style de la personne. Si elle accepte la nouveauté, la 3e tenue peut être plus audacieuse.
Textes en français, tutoiement, ton chic et chaleureux :
- Français impeccable avec TOUS les accents (« Éclat bohème », jamais « Eclat boheme »), majuscule seulement au premier mot.
- name : 2 à 4 mots, évocateur et précis (« Camel du lundi », « Néo-preppy », « Marinière et soleil »), jamais « Look 1 ». Évite les mots usés : élégance, urbain, intemporel, casual, allure. Trois noms bien différents.
- vibe : une phrase courte qui dit pourquoi cette tenue marche aujourd'hui (météo, humeur).
- tip : un conseil concret de styliste pour la porter (rentrer, retrousser, ceinturer, superposer…), 1 phrase. Il ne parle QUE des pièces de cette tenue, sans en citer d'autres.
- Le nom et la phrase décrivent vraiment la tenue : ils ne citent AUCUNE pièce, matière ou couleur absente de la tenue (pas « trench » sans trench, pas « cachemire » sans cachemire, pas « terracotta » sans terracotta).
Si la garde-robe ne permet pas 3 tenues correctes, renvoie-en moins plutôt qu'une tenue ratée.`;

export const OUTFIT_SCHEMA = {
  type: 'object',
  properties: {
    outfits: {
      type: 'array',
      items: {
        type: 'object',
        // Les pièces d'abord : le modèle nomme la tenue APRÈS l'avoir composée (moins de noms trompeurs).
        properties: {
          garment_ids: { type: 'array', items: { type: 'string' } },
          name: { type: 'string' },
          vibe: { type: 'string' },
          tip: { type: 'string' },
        },
        required: ['garment_ids', 'name', 'vibe', 'tip'],
        propertyOrdering: ['garment_ids', 'name', 'vibe', 'tip'],
      },
    },
  },
  required: ['outfits'],
};

const MOOD_TEXT: Record<Mood, string> = {
  free: 'libre : choisis ce qui lui ira le mieux aujourd’hui',
  cozy: 'chaleureux : douceur, matières enveloppantes, couleurs chaudes',
  chic: 'chic : net, soigné, plus habillé que d’habitude',
  relaxed: 'décontracté : confort avant tout, mais toujours soigné',
  sporty: 'sportif : pièces sport et baskets, dynamique',
  bold: 'audacieux : une association inattendue ou une pièce forte',
};

// Résumé lisible des réponses au questionnaire (src/data/questionnaire.ts).
const LABELS: Record<string, Record<string, string>> = {
  wardrobe: { women: 'femme', men: 'homme', both: 'femme et homme' },
  week: { school: 'cours', office: 'bureau', remote: 'télétravail', onfeet: 'travail debout', kids: 'enfants', nightout: 'sorties le soir', sport: 'sport' },
  dresscode: { none: 'aucun', casual: 'décontracté', smart: 'smart casual', formal: 'formel', uniform: 'tenue imposée' },
  morningTime: { rush: 'moins de 5 min (tenues simples)', normal: '5 à 15 min', slow: 'prend son temps' },
  coverage: { none: 'aucune', shoulders: 'épaules couvertes', legs: 'jambes couvertes', neckline: 'pas de décolleté', loose: 'tenues amples', hijab: 'porte le voile' },
  image: { elegant: 'élégant', cool: 'cool', original: 'original', neat: 'discret et soigné', comfy: 'confort', sexy: 'séduisant' },
  prints: { love: 'adore les imprimés', some: 'imprimés avec modération (un par tenue)', plain: 'uni seulement' },
  boldness: { safe: 'reste dans sa zone de confort', bit: 'un peu de nouveauté', surprise: 'aime être surpris' },
  fits: { slim: 'ajusté', regular: 'droit', loose: 'ample', oversize: 'oversize' },
  highlight: { waist: 'la taille', legs: 'les jambes', shoulders: 'les épaules', arms: 'les bras', nothing: 'rien en particulier' },
  height: { short: 'moins de 1,60 m', medium: '1,60 à 1,75 m', tall: 'plus de 1,75 m' },
  shoes: { sneakers: 'baskets', boots: 'boots', loafers: 'mocassins', heels: 'talons', flats: 'ballerines', sandals: 'sandales' },
  goodMood: { color: 'de la couleur', favorite: 'sa pièce préférée', dressy: 'plus habillé', same: 'rien ne change' },
  confidence: { black: 'tout en noir', statement: 'une pièce forte', comfort: 'confort absolu', sharp: 'très habillé' },
  lazy: { jogging: 'jogging assumé', jeans: 'jean et sweat', dress: 'robe simple', effort: 'fait quand même un effort' },
};
const COLORS: Record<string, string> = {
  black: 'noir', white: 'blanc', beige: 'beige et camel', grey: 'gris', navy: 'marine', blue: 'bleu', green: 'vert et kaki', brown: 'marron',
  red: 'rouge et bordeaux', pink: 'rose', yellow: 'jaune et moutarde', purple: 'violet et prune', pastel: 'pastels', bright: 'couleurs vives', none: 'aucune',
};
const QUESTION_TEXT: Record<string, string> = {
  wardrobe: 'Rayon', week: 'Semaine', dresscode: 'Code vestimentaire', morningTime: 'Temps le matin', coverage: 'Couverture (STRICT)',
  image: 'Veut paraître', colorsLoved: 'Couleurs aimées', colorsAvoid: 'Couleurs évitées', prints: 'Imprimés', boldness: 'Audace',
  fits: 'Coupes préférées', highlight: 'Aime mettre en valeur', height: 'Taille', shoes: 'Chaussures préférées',
  goodMood: 'Bonne humeur → porte', confidence: 'Besoin de confiance → porte', lazy: 'Jour de flemme → porte',
};

const STYLE_TEXT: Record<string, string> = {
  classic: 'classique', street: 'streetwear', minimal: 'minimaliste', chic: 'chic', modest: 'modeste', boho: 'bohème',
  sporty: 'sportswear', vintage: 'vintage', rock: 'rock', colorful: 'coloré',
};

export function describeProfile(answers: Record<string, string[]> = {}, styles: string[] = []): string {
  const lines: string[] = [];
  if (styles.length) lines.push(`Styles préférés (déduits de ses choix) : ${styles.map((s) => STYLE_TEXT[s] ?? s).join(', ')}`);
  for (const [q, label] of Object.entries(QUESTION_TEXT)) {
    const ids = answers[q];
    if (!ids?.length) continue;
    const dict = q.startsWith('colors') ? COLORS : LABELS[q] ?? {};
    lines.push(`${label} : ${ids.map((id) => dict[id] ?? id).join(', ')}`);
  }
  return lines.join('\n');
}

const CAT_FR: Record<string, string> = { top: 'haut', bottom: 'bas', dress: 'robe', outer: 'veste', shoes: 'chaussures', accessory: 'accessoire' };

export function buildOutfitPrompt(opts: {
  wardrobe: WardrobeItem[]; answers?: Record<string, string[]>; styles?: string[]; weather: Weather; mood: Mood;
  recentOutfits?: string[]; disliked?: string[];
}): string {
  const w = opts.weather;
  const weather = `${w.city ? `${w.city}, ` : ''}${w.tempC} °C ressentis pour la journée${w.minC != null && w.maxC != null ? ` (min ${w.minC}, max ${w.maxC})` : ''}, ${
    w.condition === 'rain' ? 'pluie' : w.condition === 'sun' ? 'soleil' : 'nuageux'}`;
  // Liste compacte = moins de jetons = moins cher. Une ligne par pièce.
  const items = opts.wardrobe.map((g) => [
    g.id, CAT_FR[g.category] ?? g.category, g.label, g.color_name, `coupe ${g.fit}`, g.material ?? '', g.pattern && g.pattern !== 'Uni' ? g.pattern : '',
    `chaleur ${g.warmth}/3`, `habillé ${g.formality}/3`, g.seasons.length === 4 ? 'toutes saisons' : g.seasons.join('+'),
    g.days_since_worn == null ? 'jamais porté' : `porté il y a ${g.days_since_worn} j`,
  ].filter(Boolean).join(' | ')).join('\n');
  return [
    `PROFIL\n${describeProfile(opts.answers, opts.styles) || 'Non renseigné'}`,
    `MÉTÉO\n${weather}`,
    `HUMEUR DU JOUR\n${MOOD_TEXT[opts.mood] ?? MOOD_TEXT.free}`,
    opts.recentOutfits?.length ? `TENUES DES DERNIERS JOURS (à ne pas refaire)\n${opts.recentOutfits.join('\n')}` : '',
    opts.disliked?.length ? `TENUES REFUSÉES RÉCEMMENT (à éviter)\n${opts.disliked.join('\n')}` : '',
    `GARDE-ROBE DISPONIBLE (id | catégorie | nom | couleur | …)\n${items}`,
    'Compose 4 tenues, de la meilleure à la moins bonne (on en gardera 3).',
  ].filter(Boolean).join('\n\n');
}

/** Tenues longues qui se portent sur un pantalon. */
const LONG_DRESS = /qamis|qami|abaya|tunique|kurta|djellaba|caftan|kaftan|jilbab/i;

/** Contrôle qualité : renvoie la raison du refus, ou null si la tenue est correcte. */
export function rejectReason(o: ProposedOutfit, byId: Map<string, WardrobeItem>, weather: Weather): string | null {
  const ids = o.garment_ids ?? [];
  if (new Set(ids).size !== ids.length) return 'pièce en double';
  const items = ids.map((id) => byId.get(id));
  if (items.some((x) => !x)) return 'pièce inventée';
  const count = (c: string) => items.filter((x) => x!.category === c).length;
  const tops = count('top'), bottoms = count('bottom'), dresses = count('dress'), shoes = count('shoes'), outers = count('outer'), acc = count('accessory');
  const longDress = items.some((x) => x!.category === 'dress' && LONG_DRESS.test(`${x!.subtype} ${x!.label}`));
  const base = (dresses === 1 && tops === 0 && (bottoms === 0 || (bottoms === 1 && longDress))) || (dresses === 0 && bottoms === 1 && tops >= 1 && tops <= 2);
  if (!base) return 'tenue incomplète';
  if (shoes !== 1) return 'chaussures';
  if (outers > 1 || acc > 2) return 'trop de pièces';
  const hasOuter = [...byId.values()].some((x) => x.category === 'outer');
  if ((weather.tempC < 15 || weather.condition === 'rain') && hasOuter && outers === 0) return 'veste manquante';
  if (weather.tempC > 24 && outers > 0) return 'veste en trop';
  const main = items.filter((x) => x!.category !== 'accessory');
  if (weather.tempC >= 18 && main.some((x) => x!.warmth === 3 && x!.category !== 'outer')) return 'trop chaud';
  if (weather.tempC >= 22 && main.some((x) => x!.warmth === 3)) return 'trop chaud';
  const onlyCold = (x: WardrobeItem) => x.seasons.length > 0 && x.seasons.every((z) => z === 'autumn' || z === 'winter');
  if (weather.tempC >= 20 && main.some((x) => onlyCold(x!))) return 'pièce d’hiver par temps chaud';
  if (weather.tempC <= 8 && main.some((x) => x!.seasons.length === 1 && x!.seasons[0] === 'summer')) return 'pièce d’été par grand froid';
  // Le mélange chic/décontracté est moderne (baskets et abaya, blazer et jean). On refuse seulement
  // les vrais contresens : chaussures très habillées avec un bas très décontracté (escarpins + jogging).
  const shoe = items.find((x) => x!.category === 'shoes')!;
  const bottom = items.find((x) => x!.category === 'bottom');
  if (bottom && shoe.formality === 3 && bottom.formality === 1 && /jogging|survêt|short|legging|cargo/i.test(`${bottom.subtype} ${bottom.label}`)) return 'formalité incohérente';
  return null;
}

/** « Rock Chic Inattendu » → « Rock chic inattendu », mais « Douceur d'automne à Roubaix » reste tel quel. */
function sentenceCase(name: string): string {
  const words = name.split(' ');
  const first = name.charAt(0).toUpperCase() + name.slice(1);
  const caps = words.slice(1).filter((w) => /^[A-ZÀ-Ý]/.test(w)).length;
  const longWords = words.slice(1).filter((w) => w.length > 3).length;
  if (longWords < 2 || caps < longWords) return first; // pas un « Titre Anglais » : on ne touche qu'à la 1re lettre
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : /^[A-ZÀ-Ý][a-zà-ÿ'-]+$/.test(w) ? w.toLowerCase() : w)).join(' ');
}

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Le nom ou la phrase citent-ils le type d'une pièce de la garde-robe qui n'est pas dans la tenue ? */
function misleadingName(o: ProposedOutfit, byId: Map<string, WardrobeItem>, wardrobe: WardrobeItem[]): boolean {
  const text = ` ${norm(`${o.name} ${o.vibe ?? ''}`)} `;
  const inOutfit = norm(o.garment_ids.map((id) => `${byId.get(id)?.subtype} ${byId.get(id)?.label} ${byId.get(id)?.material ?? ''}`).join(' '));
  return wardrobe.some((g) => {
    const word = norm(g.subtype).split(' ')[0];
    return word.length >= 4 && text.includes(` ${word}`) && !inOutfit.includes(word);
  });
}

/** Garde les tenues correctes, distinctes, limitées à 3. */
export function validateOutfits(list: ProposedOutfit[], wardrobe: WardrobeItem[], weather: Weather): { ok: ProposedOutfit[]; rejected: string[] } {
  const byId = new Map(wardrobe.map((g) => [g.id, g]));
  const ok: ProposedOutfit[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();
  for (const o of list ?? []) {
    const reason = rejectReason(o, byId, weather);
    const key = [...(o.garment_ids ?? [])].sort().join(',');
    if (!reason && misleadingName(o, byId, wardrobe)) { rejected.push(`${o.name} : nom trompeur (cite une pièce absente)`); continue; }
    if (reason) rejected.push(`${o.name} : ${reason}`);
    else if (seen.has(key)) rejected.push(`${o.name} : doublon`);
    else { seen.add(key); ok.push({ name: sentenceCase(o.name.trim().slice(0, 40)), vibe: (o.vibe ?? '').trim().slice(0, 140), tip: (o.tip ?? '').trim().slice(0, 220), garment_ids: o.garment_ids }); }
  }
  return { ok: ok.slice(0, 3), rejected };
}
