// Garde-robes de test pour juger la qualité des looks (étape 5 : qualité et coût).
import type { Mood, Weather, WardrobeItem } from '../../supabase/functions/_shared/outfits.ts';

const ALL = ['spring', 'summer', 'autumn', 'winter'];
const MID = ['spring', 'autumn'];
const COLD = ['autumn', 'winter'];
const HOT = ['spring', 'summer'];
let n = 0;
/** g(catégorie, sous-type, nom, couleur, coupe, matière, chaleur, habillé, saisons, motif) */
const g = (category: string, subtype: string, label: string, color_name: string, fit = 'regular', material = 'Coton', warmth = 2, formality = 2,
  seasons = ALL, pattern = 'Uni', days_since_worn: number | null = null): WardrobeItem =>
  ({ id: `p${++n}`, category, subtype, label, color_name, fit, material, warmth, formality, seasons, pattern, days_since_worn });

export type Case = { name: string; answers: Record<string, string[]>; styles: string[]; wardrobe: WardrobeItem[]; weather: Weather; mood: Mood };

const femmeVoilee: WardrobeItem[] = [
  g('top', 'Pull', 'Pull en maille beige', 'Beige', 'loose', 'Maille', 3, 2, COLD, 'Uni', 6),
  g('top', 'Chemise', 'Chemise longue blanche', 'Blanc', 'loose', 'Coton', 1, 2, ALL, 'Uni', 2),
  g('top', 'Tunique', 'Tunique longue kaki', 'Kaki', 'loose', 'Viscose', 2, 2, ALL),
  g('bottom', 'Pantalon large', 'Pantalon large noir', 'Noir', 'loose', 'Crêpe', 2, 3),
  g('bottom', 'Jean', 'Jean droit brut', 'Bleu jean', 'regular', 'Denim', 2, 1, ALL, 'Uni', 1),
  g('bottom', 'Jupe', 'Jupe plissée longue marine', 'Marine', 'loose', 'Polyester', 2, 2),
  g('dress', 'Abaya', 'Abaya marron', 'Marron', 'loose', 'Crêpe', 2, 3),
  g('outer', 'Trench', 'Trench beige', 'Beige', 'regular', 'Coton', 2, 3, MID),
  g('outer', 'Manteau', 'Manteau long camel', 'Camel', 'regular', 'Laine', 3, 3, COLD, 'Uni', 9),
  g('shoes', 'Baskets', 'Baskets blanches', 'Blanc', 'regular', 'Cuir', 2, 1, ALL, 'Uni', 1),
  g('shoes', 'Mocassins', 'Mocassins noirs', 'Noir', 'regular', 'Cuir', 2, 3),
  g('shoes', 'Bottines', 'Bottines marron', 'Marron', 'regular', 'Cuir', 3, 2, COLD),
  g('accessory', 'Voile', 'Voile crème', 'Crème', 'regular', 'Mousseline', 1, 2),
  g('accessory', 'Voile', 'Voile prune', 'Violet', 'regular', 'Viscose', 1, 2),
  g('accessory', 'Sac', 'Sac cabas noir', 'Noir', 'regular', 'Cuir', 1, 2),
];

const homme: WardrobeItem[] = [
  g('top', 'T-shirt', 'T-shirt blanc', 'Blanc', 'regular', 'Coton', 1, 1, ALL, 'Uni', 1),
  g('top', 'Sweat', 'Hoodie noir', 'Noir', 'oversize', 'Molleton', 3, 1, COLD),
  g('top', 'Chemise', 'Chemise oxford bleu ciel', 'Bleu', 'regular', 'Coton', 1, 2),
  g('top', 'Pull', 'Pull col rond marine', 'Marine', 'regular', 'Laine', 3, 2, COLD, 'Uni', 12),
  g('top', 'Polo', 'Polo en maille vert', 'Vert', 'slim', 'Maille', 1, 2, HOT),
  g('bottom', 'Jean', 'Jean slim noir', 'Noir', 'slim', 'Denim', 2, 1),
  g('bottom', 'Chino', 'Chino beige', 'Beige', 'regular', 'Coton', 2, 2),
  g('bottom', 'Cargo', 'Cargo kaki', 'Kaki', 'loose', 'Coton', 2, 1),
  g('bottom', 'Jogging', 'Jogging gris', 'Gris', 'regular', 'Molleton', 2, 1),
  g('outer', 'Doudoune', 'Doudoune noire', 'Noir', 'regular', 'Nylon', 3, 1, COLD),
  g('outer', 'Veste en jean', 'Veste en jean', 'Bleu jean', 'regular', 'Denim', 2, 1, MID),
  g('outer', 'Blazer', 'Blazer marine', 'Marine', 'slim', 'Laine', 2, 3),
  g('shoes', 'Baskets', 'Baskets blanches', 'Blanc', 'regular', 'Cuir', 2, 1, ALL, 'Uni', 1),
  g('shoes', 'Derbies', 'Derbies marron', 'Marron', 'regular', 'Cuir', 2, 3),
  g('shoes', 'Running', 'Running grises', 'Gris', 'regular', 'Mesh', 1, 1),
  g('accessory', 'Casquette', 'Casquette noire', 'Noir', 'regular', 'Coton', 1, 1),
  g('accessory', 'Montre', 'Montre argentée', 'Argenté', 'regular', 'Métal', 1, 2),
];

const femmeColoree: WardrobeItem[] = [
  g('top', 'Top', 'Top satiné rose', 'Rose', 'regular', 'Satin', 1, 3, HOT),
  g('top', 'Pull', 'Pull rayé marinière', 'Blanc', 'regular', 'Coton', 2, 2, MID, 'Rayé'),
  g('top', 'Chemisier', 'Chemisier fleuri', 'Jaune', 'loose', 'Viscose', 1, 2, HOT, 'Fleuri'),
  g('top', 'T-shirt', 'T-shirt noir', 'Noir', 'slim', 'Coton', 1, 1),
  g('bottom', 'Jean', 'Jean mom bleu', 'Bleu jean', 'loose', 'Denim', 2, 1),
  g('bottom', 'Jupe', 'Jupe midi verte', 'Vert', 'regular', 'Satin', 1, 3, HOT),
  g('bottom', 'Short', 'Short en lin écru', 'Crème', 'loose', 'Lin', 1, 1, ['summer']),
  g('dress', 'Robe', 'Robe portefeuille à fleurs', 'Rouge', 'regular', 'Viscose', 1, 2, HOT, 'Fleuri'),
  g('dress', 'Robe', 'Petite robe noire', 'Noir', 'slim', 'Crêpe', 1, 3),
  g('outer', 'Veste', 'Veste en jean claire', 'Bleu jean', 'regular', 'Denim', 2, 1, MID),
  g('outer', 'Blazer', 'Blazer oversize gris', 'Gris', 'oversize', 'Laine', 2, 3),
  g('shoes', 'Sandales', 'Sandales dorées', 'Doré', 'regular', 'Cuir', 1, 2, ['summer']),
  g('shoes', 'Baskets', 'Baskets blanches', 'Blanc', 'regular', 'Cuir', 2, 1),
  g('shoes', 'Escarpins', 'Escarpins rouges', 'Rouge', 'regular', 'Cuir', 1, 3),
  g('accessory', 'Sac', 'Sac banane camel', 'Camel', 'regular', 'Cuir', 1, 1),
  g('accessory', 'Bijou', 'Créoles dorées', 'Doré', 'regular', 'Métal', 1, 2),
];

const petiteGardeRobe: WardrobeItem[] = [
  g('top', 'T-shirt', 'T-shirt gris chiné', 'Gris'), g('top', 'Pull', 'Pull noir', 'Noir', 'regular', 'Laine', 3, 2, COLD),
  g('bottom', 'Jean', 'Jean bleu', 'Bleu jean', 'regular', 'Denim'), g('shoes', 'Baskets', 'Baskets noires', 'Noir', 'regular', 'Toile', 2, 1),
  g('outer', 'Parka', 'Parka kaki', 'Kaki', 'regular', 'Coton', 3, 1, COLD),
];

const F = (o: Record<string, string[]>) => ({ wardrobe: ['women'], ...o });
export const CASES: Case[] = [
  { name: 'Femme voilée, 7 °C pluie, libre', answers: F({ coverage: ['hijab', 'legs', 'shoulders'], accessories: ['hijab', 'bag'], prints: ['some'], boldness: ['bit'], image: ['elegant', 'neat'] }),
    styles: ['modest', 'chic', 'minimal'], wardrobe: femmeVoilee, weather: { city: 'Lyon', tempC: 7, minC: 4, maxC: 11, condition: 'rain' }, mood: 'free' },
  { name: 'Femme voilée, 18 °C soleil, chic', answers: F({ coverage: ['hijab', 'legs', 'shoulders'], accessories: ['hijab'], prints: ['plain'], boldness: ['safe'] }),
    styles: ['modest', 'classic'], wardrobe: femmeVoilee, weather: { city: 'Paris', tempC: 18, condition: 'sun' }, mood: 'chic' },
  { name: 'Homme street, 5 °C, décontracté', answers: { wardrobe: ['men'], week: ['school', 'sport'], dresscode: ['none'], image: ['cool', 'comfy'], fits: ['oversize', 'regular'], boldness: ['bit'] },
    styles: ['street', 'sporty'], wardrobe: homme, weather: { city: 'Lille', tempC: 5, condition: 'cloud' }, mood: 'relaxed' },
  { name: 'Homme, 20 °C, chic (rendez-vous)', answers: { wardrobe: ['men'], dresscode: ['smart'], image: ['elegant'], colorsAvoid: ['bright'] },
    styles: ['classic', 'minimal'], wardrobe: homme, weather: { city: 'Bordeaux', tempC: 20, condition: 'sun' }, mood: 'chic' },
  { name: 'Femme colorée, 27 °C, audacieuse', answers: F({ prints: ['love'], boldness: ['surprise'], colorsLoved: ['bright', 'pink', 'yellow'], image: ['original'] }),
    styles: ['colorful', 'boho'], wardrobe: femmeColoree, weather: { city: 'Marseille', tempC: 27, condition: 'sun' }, mood: 'bold' },
  { name: 'Femme colorée, 14 °C, uni de préférence', answers: F({ prints: ['some'], boldness: ['safe'], coverage: ['neckline'] }),
    styles: ['minimal', 'classic'], wardrobe: femmeColoree, weather: { city: 'Nantes', tempC: 14, condition: 'cloud' }, mood: 'free' },
  { name: 'Petite garde-robe (5 pièces), 3 °C', answers: { wardrobe: ['men'] }, styles: ['minimal'], wardrobe: petiteGardeRobe,
    weather: { city: 'Strasbourg', tempC: 3, condition: 'cloud' }, mood: 'free' },
];
