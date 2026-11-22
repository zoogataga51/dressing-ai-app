/**
 * Données de démonstration, utilisées tant que Supabase n'est pas branché.
 * Elles permettent de tester toute l'interface sur le téléphone dès maintenant.
 */
import type { Garment, HistoryEntry, Outfit, Weather } from '@/types';

const g = (
  id: string, category: Garment['category'], subtype: string, label: string, colorName: string, colorHex: string,
  extra: Partial<Garment> = {},
): Garment => ({
  id, category, subtype, label, colorName, colorHex,
  fit: 'regular', material: 'Coton', seasons: ['autumn', 'winter'], warmth: 2, formality: 2, wearCount: 0,
  ...extra,
});

export const MOCK_WARDROBE: Garment[] = [
  g('g1', 'top', 'Pull', 'Pull en maille', 'Beige', '#E9DFCF', { fit: 'loose', material: 'Maille', warmth: 3, wearCount: 6 }),
  g('g2', 'bottom', 'Jean', 'Jean droit brut', 'Bleu brut', '#34405A', { material: 'Denim', wearCount: 9 }),
  g('g3', 'outer', 'Manteau', 'Manteau camel', 'Camel', '#B48A5E', { material: 'Laine', warmth: 3, formality: 3, wearCount: 4 }),
  g('g4', 'top', 'Sweat', 'Sweat noir', 'Noir', '#232323', { fit: 'oversize', formality: 1, wearCount: 5 }),
  g('g5', 'shoes', 'Sneakers', 'Sneakers blanches', 'Blanc', '#ECEAE4', { material: 'Cuir', seasons: ['spring', 'summer', 'autumn', 'winter'], formality: 1, wearCount: 11 }),
  g('g6', 'bottom', 'Cargo', 'Cargo kaki', 'Kaki', '#7F846C', { fit: 'loose', formality: 1, wearCount: 2 }),
  g('g7', 'top', 'Chemise', 'Chemise oversize', 'Bleu ciel', '#E4E9F2', { fit: 'oversize', seasons: ['spring', 'summer', 'autumn'], warmth: 1, wearCount: 3 }),
  g('g8', 'accessory', 'Casquette', 'Casquette bleue', 'Bleu', '#3E5C8A', { formality: 1, seasons: ['spring', 'summer', 'autumn', 'winter'] }),
  g('g9', 'bottom', 'Pantalon', 'Pantalon beige', 'Beige', '#D8C8AE', { formality: 3, wearCount: 1 }),
  g('g10', 'outer', 'Doudoune', 'Doudoune olive', 'Olive', '#44513F', { warmth: 3, formality: 1, seasons: ['winter'], wearCount: 2 }),
  g('g11', 'shoes', 'Mocassins', 'Mocassins bruns', 'Brun', '#6B4A33', { material: 'Cuir', formality: 3, wearCount: 1 }),
  g('g12', 'top', 'T-shirt', 'T-shirt blanc', 'Blanc', '#ECEAE4', { warmth: 1, seasons: ['spring', 'summer', 'autumn', 'winter'], formality: 1, wearCount: 8 }),
  g('g13', 'outer', 'Trench', 'Trench clair', 'Sable', '#CFC1A3', { seasons: ['spring', 'autumn'], formality: 3 }),
  g('g14', 'accessory', 'Voile', 'Voile prune', 'Prune', '#6E3B55', { material: 'Viscose', seasons: ['spring', 'summer', 'autumn', 'winter'] }),
  g('g15', 'shoes', 'Baskets', 'Baskets grises', 'Gris', '#C9C5BD', { formality: 1, wearCount: 3 }),
];

export const MOCK_OUTFITS: Outfit[] = [
  { id: 'o1', name: 'Casual chic', vibe: 'Chaud et lumineux pour un ciel gris', garmentIds: ['g1', 'g2', 'g5', 'g3'],
    tip: 'Un haut neutre laisse briller une veste de couleur : c’est elle qui fait la tenue.' },
  { id: 'o2', name: 'Urbain', vibe: 'Décontracté, idéal pour bouger', garmentIds: ['g4', 'g6', 'g15', 'g10'],
    tip: 'Rentre légèrement le sweat devant : la silhouette paraît tout de suite plus nette.' },
  { id: 'o3', name: 'Douceur', vibe: 'Tons clairs pour une humeur calme', garmentIds: ['g7', 'g9', 'g11', 'g13'],
    tip: 'Ton sur ton clair : remonte les manches du trench pour casser la longueur.' },
];

export const MOCK_WEATHER: Weather = { city: 'Paris', tempC: 8, condition: 'cloud' };

export const MOCK_HISTORY: HistoryEntry[] = [
  { date: '2026-11-21', outfit: MOCK_OUTFITS[0], tempC: 9, mood: 'cozy' },
  { date: '2026-11-20', outfit: MOCK_OUTFITS[1], tempC: 7, mood: 'free' },
  { date: '2026-11-19', outfit: MOCK_OUTFITS[2], tempC: 11, mood: 'relaxed' },
  { date: '2026-11-18', outfit: { id: 'o4', name: 'Monochrome', vibe: '', garmentIds: ['g12', 'g4', 'g5', 'g2'] }, tempC: 10, mood: 'free' },
  { date: '2026-11-17', outfit: { id: 'o5', name: 'Chic décontracté', vibe: '', garmentIds: ['g7', 'g2', 'g11', 'g3'] }, tempC: 8, mood: 'chic' },
];
