/** Choix proposés pour décrire un vêtement (ajout et modification). */
import type { Category, Fit, Season } from '@/types';

export const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'top', label: 'Haut' }, { id: 'bottom', label: 'Bas' }, { id: 'dress', label: 'Robe' },
  { id: 'outer', label: 'Veste' }, { id: 'shoes', label: 'Chaussures' }, { id: 'accessory', label: 'Accessoire' },
];
export const COLOR_OPTIONS: { name: string; hex: string }[] = [
  { name: 'Noir', hex: '#1B1B1F' }, { name: 'Blanc', hex: '#F1EFEA' }, { name: 'Beige', hex: '#E3D5BE' }, { name: 'Camel', hex: '#B48A5E' },
  { name: 'Gris', hex: '#9C9A95' }, { name: 'Marine', hex: '#24314F' }, { name: 'Bleu', hex: '#3E68C9' }, { name: 'Bleu jean', hex: '#4A6285' },
  { name: 'Kaki', hex: '#7F846C' }, { name: 'Vert', hex: '#3F6B4F' }, { name: 'Marron', hex: '#6B4A33' }, { name: 'Bordeaux', hex: '#7A2632' },
  { name: 'Rouge', hex: '#C2353A' }, { name: 'Rose', hex: '#E5A3B8' }, { name: 'Jaune', hex: '#E2B73F' }, { name: 'Violet', hex: '#6E3B55' },
  { name: 'Orange', hex: '#E0773A' }, { name: 'Crème', hex: '#F2EADB' }, { name: 'Argenté', hex: '#C4C7CC' }, { name: 'Doré', hex: '#C9A54B' },
];
/** Motifs (mêmes valeurs que la reconnaissance IA, supabase/functions/_shared/garment.ts). */
export const PATTERN_OPTIONS = ['Uni', 'Rayé', 'À carreaux', 'Fleuri', 'À pois', 'Imprimé', 'Graphique', 'Camouflage', 'Animal'] as const;
export const FIT_OPTIONS: { id: Fit; label: string }[] = [
  { id: 'slim', label: 'Ajusté' }, { id: 'regular', label: 'Droit' }, { id: 'loose', label: 'Ample' }, { id: 'oversize', label: 'Oversize' },
];
export const SEASON_OPTIONS: { id: Season; label: string }[] = [
  { id: 'spring', label: 'Printemps' }, { id: 'summer', label: 'Été' }, { id: 'autumn', label: 'Automne' }, { id: 'winter', label: 'Hiver' },
];
