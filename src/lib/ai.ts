/**
 * Services d'IA, toujours via les fonctions serveur Supabase (la clé de l'IA n'est JAMAIS dans l'appli) :
 *
 *  - analyzeGarment : la photo part dans le bucket privé, puis « analyze-garment » reconnaît
 *    type, couleur, coupe, matière, motif et saisons. L'utilisateur valide ou corrige.
 *  - fetchAiOutfits : « generate-outfits » compose les 3 looks du jour (Gemini), vérifiés côté serveur.
 *
 * En mode démo, sans réseau ou si l'IA échoue : proposition par défaut à corriger (photos) et
 * moteur par règles du téléphone (looks). L'appli ne reste jamais bloquée.
 */
import { localDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { uploadPhoto } from '@/lib/sync';
import type { Category, Fit, Garment, Mood, Outfit, Season, Weather } from '@/types';

export type GarmentGuess = Pick<Garment, 'category' | 'subtype' | 'colorName' | 'colorHex' | 'fit' | 'material' | 'seasons' | 'warmth' | 'formality'> & {
  label?: string;
  pattern?: string;
  /** 0 → 1 ; 0 = proposition par défaut (IA indisponible). */
  confidence: number;
  /** false si l'IA ne voit pas de vêtement sur la photo. */
  isGarment: boolean;
  /** Chemin de la photo dans le bucket, si elle a été envoyée. */
  photoPath?: string;
  cutoutUrl?: string;
};

const DEFAULT_GUESS: GarmentGuess = {
  category: 'top' as Category, subtype: 'Pull', colorName: 'Beige', colorHex: '#E3D5BE', fit: 'loose' as Fit, material: 'Maille',
  seasons: ['autumn', 'winter'] as Season[], warmth: 3, formality: 2, confidence: 0, isGarment: true,
};

type Analysis = {
  is_garment: boolean; category: Category; subtype: string; label: string; color_name: string; color_hex: string; fit: Fit;
  material: string; pattern: string; seasons: Season[]; warmth: 1 | 2 | 3; formality: 1 | 2 | 3; confidence: number;
};

/**
 * Envoie la photo puis demande l'analyse. `userId` absent (démo) → proposition par défaut.
 * La photo envoyée reste rattachée au vêtement (photoPath), même si l'analyse échoue.
 */
export async function analyzeGarment(photoUri: string, opts: { userId: string | null; garmentId: string }): Promise<GarmentGuess> {
  if (!supabase || !opts.userId) {
    await new Promise((r) => setTimeout(r, 1100)); // laisse le temps à l'animation de « scan »
    return DEFAULT_GUESS;
  }
  let photoPath: string | undefined;
  try {
    photoPath = await uploadPhoto(opts.userId, opts.garmentId, photoUri);
    const { data, error } = await supabase.functions.invoke<{ analysis: Analysis }>('analyze-garment', { body: { path: photoPath } });
    if (error || !data?.analysis) throw error ?? new Error('Réponse vide');
    const a = data.analysis;
    return {
      category: a.category, subtype: a.subtype, label: a.label, colorName: a.color_name, colorHex: a.color_hex, fit: a.fit,
      material: a.material, pattern: a.pattern, seasons: a.seasons, warmth: a.warmth, formality: a.formality,
      confidence: a.confidence, isGarment: a.is_garment, photoPath,
    };
  } catch {
    return { ...DEFAULT_GUESS, photoPath };
  }
}

type OutfitRow = { id: string; name: string; vibe: string | null; tip: string | null; garment_ids: string[] };

/**
 * Looks du jour composés par l'IA. Renvoie null si l'IA n'a rien pu proposer :
 * l'appli utilise alors le moteur par règles.
 */
export async function fetchAiOutfits(mood: Mood, weather: Weather, wardrobe: Garment[]): Promise<Outfit[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke<{ outfits: OutfitRow[]; fallback?: boolean }>('generate-outfits', {
      body: { mood, weather, date: localDate() },
    });
    if (error || !data?.outfits?.length) return null;
    const ids = new Set(wardrobe.map((g) => g.id));
    const outfits = data.outfits
      .filter((o) => o.garment_ids.every((id) => ids.has(id))) // pièce supprimée entre-temps : on écarte le look
      .map((o) => ({ id: o.id, name: o.name, vibe: o.vibe ?? '', tip: o.tip ?? undefined, garmentIds: o.garment_ids, source: 'ai' as const }));
    return outfits.length ? outfits : null;
  } catch {
    return null;
  }
}
