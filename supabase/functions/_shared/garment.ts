// Reconnaissance d'un vêtement sur une photo : consignes et format de réponse.
// Les listes doivent rester identiques à celles de l'appli (src/data/garmentOptions.ts).

export const CATEGORIES = ['top', 'bottom', 'dress', 'outer', 'shoes', 'accessory'] as const;
export const COLOR_NAMES = ['Noir', 'Blanc', 'Beige', 'Camel', 'Gris', 'Marine', 'Bleu', 'Bleu jean', 'Kaki', 'Vert', 'Marron',
  'Bordeaux', 'Rouge', 'Rose', 'Jaune', 'Violet', 'Orange', 'Crème', 'Argenté', 'Doré'] as const;
export const FITS = ['slim', 'regular', 'loose', 'oversize'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const PATTERNS = ['Uni', 'Rayé', 'À carreaux', 'Fleuri', 'À pois', 'Imprimé', 'Graphique', 'Camouflage', 'Animal'] as const;

export type GarmentAnalysis = {
  is_garment: boolean;
  category: (typeof CATEGORIES)[number];
  subtype: string;
  label: string;
  color_name: (typeof COLOR_NAMES)[number];
  color_hex: string;
  fit: (typeof FITS)[number];
  material: string;
  pattern: (typeof PATTERNS)[number];
  seasons: (typeof SEASONS)[number][];
  warmth: 1 | 2 | 3;
  formality: 1 | 2 | 3;
  confidence: number;
};

export const GARMENT_SYSTEM = `Tu es un expert textile qui catalogue la garde-robe d'une personne à partir de photos prises au téléphone.
Décris LE vêtement principal de la photo (s'il y en a plusieurs, le plus grand et le plus net). Ignore le fond (lit, sol, cintre, mur).
Règles :
- category : top (t-shirt, chemise, pull, sweat, top, body), bottom (pantalon, jean, jupe, short, legging), dress (robe, combinaison, abaya, qamis),
  outer (veste, blazer, manteau, doudoune, trench, gilet ouvert), shoes (toutes chaussures), accessory (sac, casquette, bonnet, voile, écharpe, ceinture, bijou, lunettes).
- subtype : le type précis en français, 1 à 2 mots, majuscule au début (ex. « Pull », « Jean droit », « Chemise », « Baskets », « Trench »).
- label : nom court et naturel en français, en minuscules après la première lettre (ex. « Pull en maille beige », « Jean droit brut »). Maximum 5 mots.
- color_name : la couleur DOMINANTE dans la liste imposée ; color_hex : sa teinte réelle observée (#RRGGBB), corrigée de l'éclairage.
- fit : coupe apparente. material : matière probable en français, 1 à 2 mots (« Maille », « Denim », « Coton », « Cuir », « Laine »).
- pattern : motif dans la liste imposée.
- seasons : saisons où on le porte naturellement en France. warmth : 1 léger, 2 moyen, 3 chaud. formality : 1 décontracté, 2 entre-deux, 3 habillé.
- confidence : ta certitude globale entre 0 et 1 (photo floue, sombre ou ambiguë → bas).
- is_garment : false si la photo ne montre aucun vêtement, chaussure ou accessoire de mode (remplis quand même les autres champs au mieux).`;

export const GARMENT_SCHEMA = {
  type: 'object',
  properties: {
    is_garment: { type: 'boolean' },
    category: { type: 'string', enum: CATEGORIES },
    subtype: { type: 'string' },
    label: { type: 'string' },
    color_name: { type: 'string', enum: COLOR_NAMES },
    color_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    fit: { type: 'string', enum: FITS },
    material: { type: 'string' },
    pattern: { type: 'string', enum: PATTERNS },
    seasons: { type: 'array', items: { type: 'string', enum: SEASONS } },
    warmth: { type: 'integer', enum: [1, 2, 3] },
    formality: { type: 'integer', enum: [1, 2, 3] },
    confidence: { type: 'number' },
  },
  required: ['is_garment', 'category', 'subtype', 'label', 'color_name', 'color_hex', 'fit', 'material', 'pattern', 'seasons', 'warmth', 'formality', 'confidence'],
} as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Garde-fous : valeurs bornées même si le modèle dérape. */
export function cleanAnalysis(a: GarmentAnalysis): GarmentAnalysis {
  const pick = <T extends string>(v: string, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
  const clamp3 = (n: number) => (Math.min(3, Math.max(1, Math.round(n || 2))) as 1 | 2 | 3);
  return {
    is_garment: a.is_garment !== false,
    category: pick(a.category, CATEGORIES, 'top'),
    subtype: capitalize((a.subtype || 'Vêtement').slice(0, 30)),
    label: capitalize((a.label || a.subtype || 'Vêtement').slice(0, 60)),
    color_name: pick(a.color_name, COLOR_NAMES, 'Noir'),
    color_hex: /^#[0-9A-Fa-f]{6}$/.test(a.color_hex) ? a.color_hex.toUpperCase() : '#9C9A95',
    fit: pick(a.fit, FITS, 'regular'),
    material: (a.material || '').slice(0, 30),
    pattern: pick(a.pattern, PATTERNS, 'Uni'),
    seasons: (a.seasons ?? []).filter((s) => SEASONS.includes(s)),
    warmth: clamp3(a.warmth),
    formality: clamp3(a.formality),
    confidence: Math.min(1, Math.max(0, Number(a.confidence) || 0)),
  };
}
