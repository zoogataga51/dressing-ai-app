/** Modèle de données partagé par l'appli et la base Supabase (voir supabase/migrations). */

export type Category = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'accessory';

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Hauts',
  bottom: 'Bas',
  dress: 'Robes',
  outer: 'Vestes et manteaux',
  shoes: 'Chaussures',
  accessory: 'Accessoires',
};

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Fit = 'slim' | 'regular' | 'loose' | 'oversize';
export type Warmth = 1 | 2 | 3; // 1 léger, 2 moyen, 3 chaud

export type Garment = {
  id: string;
  category: Category;
  subtype: string; // « Pull », « Jean »…
  label: string; // nom affiché : « Pull en maille beige »
  colorName: string;
  colorHex: string;
  fit: Fit;
  material: string;
  seasons: Season[];
  warmth: Warmth;
  formality: 1 | 2 | 3; // 1 décontracté → 3 habillé
  imageUrl?: string; // photo à afficher (lien temporaire Supabase Storage, ou fichier local)
  photoPath?: string; // chemin de la photo d'origine dans le bucket « garments »
  cutoutPath?: string; // chemin de la photo détourée dans le bucket
  lastWornAt?: string; // date ISO
  wearCount: number;
};

export type Outfit = {
  id: string;
  name: string;
  vibe: string; // phrase courte : « Chaud et lumineux pour un ciel gris »
  garmentIds: string[];
  tip?: string;
};

export type Mood = 'free' | 'cozy' | 'chic' | 'relaxed' | 'sporty' | 'bold';

export const MOODS: { id: Mood; label: string }[] = [
  { id: 'free', label: 'IA libre' },
  { id: 'cozy', label: 'Chaleureux' },
  { id: 'chic', label: 'Chic' },
  { id: 'relaxed', label: 'Décontracté' },
  { id: 'sporty', label: 'Sportif' },
  { id: 'bold', label: 'Audacieux' },
];

export type Weather = { city: string; tempC: number; condition: 'sun' | 'cloud' | 'rain' };

export type HistoryEntry = { date: string; outfit: Outfit; tempC: number; mood: Mood };
