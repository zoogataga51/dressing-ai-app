/**
 * Services d'IA : reconnaissance des vêtements et détourage.
 *
 * ÉTAT ACTUEL : simulés. L'appel réel passera par une Edge Function Supabase
 * (supabase/functions/analyze-garment), pour que la clé de l'API d'IA ne soit
 * JAMAIS dans l'appli (sinon n'importe qui pourrait la récupérer et la vider).
 *
 * Chaîne prévue pour une photo :
 *   1. l'appli envoie la photo dans Supabase Storage ;
 *   2. la fonction détoure l'image (outil de suppression de fond) ;
 *   3. la fonction demande à un modèle de vision : type, couleur, coupe, matière, saison ;
 *   4. l'appli affiche le résultat, l'utilisateur valide ou corrige.
 */
import type { Category, Fit, Garment, Season } from '@/types';

export type GarmentGuess = Pick<Garment, 'category' | 'subtype' | 'colorName' | 'colorHex' | 'fit' | 'material' | 'seasons' | 'warmth' | 'formality'> & {
  confidence: number; // 0 → 1
  cutoutUrl?: string;
};

export const AI_ENABLED = false;

/** Simulation : renvoie une proposition plausible à corriger par l'utilisateur. */
export async function analyzeGarment(_photoUri: string): Promise<GarmentGuess> {
  await new Promise((r) => setTimeout(r, 1100)); // laisse le temps à l'animation de « scan »
  return {
    category: 'top' as Category,
    subtype: 'Pull',
    colorName: 'Beige',
    colorHex: '#E3D5BE',
    fit: 'loose' as Fit,
    material: 'Maille',
    seasons: ['autumn', 'winter'] as Season[],
    warmth: 3,
    formality: 2,
    confidence: 0,
  };
}
