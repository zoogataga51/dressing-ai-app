/**
 * Duels de looks (inscription) : la personne choisit entre deux looks, 10 fois.
 *
 * Les images seront générées par IA (aucune vraie personne, aucun visuel copié) :
 * chaque look porte une `imagePrompt` prête à l'emploi. En attendant, l'appli affiche
 * les pièces sous forme de pastilles de couleur.
 *
 * Chaque look est étiqueté : les styles choisis donnent le profil de style de la personne.
 */

export type DuelLook = {
  id: string;
  title: string;
  pieces: { label: string; hex: string }[];
  styles: string[]; // ids de STYLE_OPTIONS
  formality: 1 | 2 | 3;
  imageUrl?: string;
  imagePrompt: string;
};

export type Duel = { id: string; a: DuelLook; b: DuelLook };

const PROMPT_BASE =
  'Flat lay fashion photo of a complete outfit on a warm off-white paper background (#F6F3EE), soft daylight, ' +
  'no person, no mannequin, no logo, no text, items neatly arranged, editorial magazine style. Outfit: ';

const look = (id: string, title: string, styles: string[], formality: 1 | 2 | 3, pieces: [string, string][], promptOutfit: string): DuelLook => ({
  id, title, styles, formality,
  pieces: pieces.map(([label, hex]) => ({ label, hex })),
  imagePrompt: PROMPT_BASE + promptOutfit,
});

export const DUELS_WOMEN: Duel[] = [
  { id: 'w1',
    a: look('w1a', 'Trench et jean', ['classic', 'chic'], 2, [['Trench', '#CFC1A3'], ['Marinière', '#F1F1EE'], ['Jean droit', '#34405A'], ['Ballerines', '#1B1B1F']],
      'beige trench coat, navy and white breton striped top, straight blue jeans, black ballet flats'),
    b: look('w1b', 'Sweat et cargo', ['street', 'sporty'], 1, [['Sweat oversize', '#9C9A95'], ['Cargo', '#5E7451'], ['Baskets', '#F5F3EE'], ['Casquette', '#1B1B1F']],
      'grey oversized hoodie, khaki cargo pants, chunky white sneakers, black cap') },
  { id: 'w2',
    a: look('w2a', 'Tout en noir', ['minimal', 'chic'], 2, [['Col roulé', '#1B1B1F'], ['Pantalon large', '#1B1B1F'], ['Bottines', '#1B1B1F'], ['Sac', '#6B4A33']],
      'black fine knit turtleneck, black wide-leg trousers, black ankle boots, small brown leather bag'),
    b: look('w2b', 'Robe fleurie', ['boho', 'colorful'], 2, [['Robe fleurie', '#E5A3B8'], ['Gilet', '#F0E6D2'], ['Sandales', '#C9A982'], ['Panier', '#C9A982']],
      'midi floral wrap dress pink tones, cream cardigan, tan leather sandals, woven basket bag') },
  { id: 'w3',
    a: look('w3a', 'Abaya moderne', ['modest', 'chic'], 3, [['Abaya', '#6B4A33'], ['Voile', '#C9A982'], ['Mocassins', '#1B1B1F'], ['Sac', '#F5F3EE']],
      'modern brown abaya, beige silk hijab neatly folded, black loafers, structured cream handbag'),
    b: look('w3b', 'Blazer et tee', ['classic', 'minimal'], 2, [['Blazer', '#24314F'], ['T-shirt', '#F5F3EE'], ['Jean', '#3E68C9'], ['Mocassins', '#6B4A33']],
      'navy blazer, white t-shirt, light blue straight jeans, brown loafers') },
  { id: 'w4',
    a: look('w4a', 'Perfecto et jupe', ['rock'], 2, [['Perfecto', '#1B1B1F'], ['T-shirt graphique', '#9C9A95'], ['Jupe en jean', '#24314F'], ['Boots', '#1B1B1F']],
      'black leather biker jacket, grey graphic tee without readable text, dark denim mini skirt, black boots'),
    b: look('w4b', 'Pastels doux', ['minimal', 'colorful'], 1, [['Pull', '#CFE0F2'], ['Pantalon', '#F0E6D2'], ['Baskets', '#F5F3EE'], ['Sac', '#E5A3B8']],
      'baby blue knit sweater, cream straight trousers, white sneakers, pale pink shoulder bag') },
  { id: 'w5',
    a: look('w5a', 'Vintage seventies', ['vintage', 'boho'], 2, [['Chemisier', '#D9A93A'], ['Jean flare', '#3E68C9'], ['Ceinture', '#6B4A33'], ['Sabots', '#6B4A33']],
      'mustard 70s style blouse, flared blue jeans, brown leather belt, brown clogs'),
    b: look('w5b', 'Tailleur moderne', ['chic', 'classic'], 3, [['Veste', '#9C9A95'], ['Pantalon', '#9C9A95'], ['Top', '#F5F3EE'], ['Escarpins', '#1B1B1F']],
      'grey tailored suit jacket and matching trousers, white silk top, black pointed pumps') },
  { id: 'w6',
    a: look('w6a', 'Jogging chic', ['sporty', 'minimal'], 1, [['Sweat', '#F0E6D2'], ['Jogging', '#F0E6D2'], ['Baskets', '#F5F3EE'], ['Doudoune', '#1B1B1F']],
      'cream matching sweatshirt and joggers set, white sneakers, short black puffer jacket'),
    b: look('w6b', 'Robe pull', ['classic', 'modest'], 2, [['Robe pull', '#6B4A33'], ['Collants', '#1B1B1F'], ['Bottes', '#1B1B1F'], ['Écharpe', '#C9A982']],
      'long brown knit sweater dress, black opaque tights, black knee boots, camel scarf') },
  { id: 'w7',
    a: look('w7a', 'Couleur franche', ['colorful'], 2, [['Pull', '#FF5A3C'], ['Pantalon', '#F5F3EE'], ['Baskets', '#F5F3EE'], ['Sac', '#3E68C9']],
      'bright coral sweater, white wide trousers, white sneakers, cobalt blue bag'),
    b: look('w7b', 'Camaïeu de beige', ['minimal', 'chic'], 2, [['Manteau', '#C9A982'], ['Pull', '#F0E6D2'], ['Pantalon', '#C9A982'], ['Bottines', '#6B4A33']],
      'camel wool coat, cream sweater, beige trousers, brown ankle boots') },
  { id: 'w8',
    a: look('w8a', 'Superpositions modestes', ['modest', 'boho'], 2, [['Tunique longue', '#5E7451'], ['Pantalon fluide', '#F0E6D2'], ['Voile', '#F0E6D2'], ['Baskets', '#F5F3EE']],
      'long khaki tunic, flowy cream trousers, cream hijab, white sneakers'),
    b: look('w8b', 'Street sportif', ['street', 'sporty'], 1, [['Veste de survêt', '#24314F'], ['Brassière', '#1B1B1F'], ['Legging', '#1B1B1F'], ['Baskets', '#F5F3EE']],
      'navy retro track jacket, black sports top, black leggings, white sneakers') },
  { id: 'w9',
    a: look('w9a', 'Chemise et jupe midi', ['classic', 'chic'], 2, [['Chemise', '#F5F3EE'], ['Jupe plissée', '#5E7451'], ['Mocassins', '#1B1B1F'], ['Ceinture', '#6B4A33']],
      'crisp white shirt, green pleated midi skirt, black loafers, thin brown belt'),
    b: look('w9b', 'Grunge douce', ['rock', 'vintage'], 1, [['Chemise à carreaux', '#9E2B32'], ['T-shirt', '#1B1B1F'], ['Jean noir', '#1B1B1F'], ['Boots', '#6B4A33']],
      'red plaid flannel shirt, black tee, black jeans, brown boots') },
  { id: 'w10',
    a: look('w10a', 'Soirée simple', ['chic'], 3, [['Robe satin', '#24314F'], ['Veste courte', '#1B1B1F'], ['Sandales', '#1B1B1F'], ['Pochette', '#C9A982']],
      'navy satin slip dress, cropped black jacket, black strappy sandals, gold clutch'),
    b: look('w10b', 'Soirée confort', ['street', 'minimal'], 1, [['Pull large', '#1B1B1F'], ['Jean', '#24314F'], ['Baskets', '#F5F3EE'], ['Créoles', '#D9A93A']],
      'oversized black sweater, dark jeans, white sneakers, gold hoop earrings') },
];

export const DUELS_MEN: Duel[] = [
  { id: 'm1',
    a: look('m1a', 'Chino et chemise', ['classic'], 2, [['Chemise oxford', '#CFE0F2'], ['Chino', '#C9A982'], ['Mocassins', '#6B4A33'], ['Ceinture', '#6B4A33']],
      'light blue oxford shirt, beige chinos, brown loafers, brown leather belt'),
    b: look('m1b', 'Hoodie et cargo', ['street', 'sporty'], 1, [['Hoodie', '#1B1B1F'], ['Cargo', '#5E7451'], ['Baskets', '#F5F3EE'], ['Casquette', '#1B1B1F']],
      'black hoodie, khaki cargo pants, white sneakers, black cap') },
  { id: 'm2',
    a: look('m2a', 'Tout en noir', ['minimal', 'chic'], 2, [['Col roulé', '#1B1B1F'], ['Pantalon', '#1B1B1F'], ['Manteau', '#1B1B1F'], ['Boots', '#1B1B1F']],
      'black turtleneck, black tailored trousers, black wool overcoat, black chelsea boots'),
    b: look('m2b', 'Chemise colorée', ['colorful', 'vintage'], 1, [['Chemise motif', '#D9A93A'], ['T-shirt', '#F5F3EE'], ['Jean', '#3E68C9'], ['Baskets', '#F5F3EE']],
      'mustard patterned short sleeve shirt open over white tee, light jeans, white sneakers') },
  { id: 'm3',
    a: look('m3a', 'Costume décontracté', ['chic', 'classic'], 3, [['Blazer', '#24314F'], ['Pull fin', '#F0E6D2'], ['Pantalon', '#9C9A95'], ['Derbies', '#6B4A33']],
      'navy blazer, cream fine knit sweater, grey wool trousers, brown derby shoes'),
    b: look('m3b', 'Survêtement rétro', ['sporty', 'street'], 1, [['Veste de survêt', '#9E2B32'], ['T-shirt', '#F5F3EE'], ['Jogging', '#1B1B1F'], ['Baskets', '#F5F3EE']],
      'burgundy retro track jacket, white tee, black joggers, white sneakers') },
  { id: 'm4',
    a: look('m4a', 'Workwear', ['vintage', 'classic'], 1, [['Veste de travail', '#C9A982'], ['T-shirt', '#F5F3EE'], ['Jean brut', '#24314F'], ['Boots', '#6B4A33']],
      'tan canvas work jacket, white tee, raw denim jeans, brown leather work boots'),
    b: look('m4b', 'Minimal clair', ['minimal'], 2, [['Pull', '#F0E6D2'], ['Pantalon', '#F5F3EE'], ['Baskets', '#F5F3EE'], ['Montre', '#9C9A95']],
      'cream knit sweater, off-white straight trousers, white minimal sneakers, silver watch') },
  { id: 'm5',
    a: look('m5a', 'Perfecto', ['rock'], 2, [['Perfecto', '#1B1B1F'], ['T-shirt', '#9C9A95'], ['Jean noir', '#1B1B1F'], ['Boots', '#1B1B1F']],
      'black leather biker jacket, grey tee, black slim jeans, black boots'),
    b: look('m5b', 'Preppy', ['classic', 'chic'], 2, [['Pull col V', '#24314F'], ['Chemise', '#F5F3EE'], ['Chino', '#5E7451'], ['Mocassins', '#6B4A33']],
      'navy v-neck sweater over white shirt, green chinos, brown penny loafers') },
  { id: 'm6',
    a: look('m6a', 'Qamis moderne', ['modest', 'chic'], 3, [['Qamis', '#F0E6D2'], ['Veste', '#24314F'], ['Mocassins', '#6B4A33'], ['Montre', '#C9A982']],
      'modern cream qamis, navy short jacket, brown loafers, gold watch'),
    b: look('m6b', 'Doudoune et jogging', ['street', 'sporty'], 1, [['Doudoune', '#5E7451'], ['Sweat', '#9C9A95'], ['Jogging', '#9C9A95'], ['Baskets', '#1B1B1F']],
      'olive puffer jacket, grey sweatshirt, grey joggers, black sneakers') },
  { id: 'm7',
    a: look('m7a', 'Couleur franche', ['colorful'], 1, [['Sweat', '#3E68C9'], ['Pantalon', '#F0E6D2'], ['Baskets', '#F5F3EE'], ['Bonnet', '#FF5A3C']],
      'cobalt blue sweatshirt, cream trousers, white sneakers, coral beanie'),
    b: look('m7b', 'Camaïeu de gris', ['minimal', 'classic'], 2, [['Manteau', '#9C9A95'], ['Pull', '#1B1B1F'], ['Pantalon', '#9C9A95'], ['Derbies', '#1B1B1F']],
      'grey wool coat, black sweater, grey trousers, black derby shoes') },
  { id: 'm8',
    a: look('m8a', 'Surchemise', ['vintage', 'boho'], 1, [['Surchemise', '#9E2B32'], ['T-shirt', '#F0E6D2'], ['Pantalon large', '#6B4A33'], ['Baskets', '#F5F3EE']],
      'burgundy corduroy overshirt, cream tee, wide brown trousers, white sneakers'),
    b: look('m8b', 'Chemise blanche', ['minimal', 'chic'], 2, [['Chemise', '#F5F3EE'], ['Pantalon', '#1B1B1F'], ['Mocassins', '#1B1B1F'], ['Ceinture', '#1B1B1F']],
      'crisp white shirt, black tailored trousers, black loafers, black belt') },
  { id: 'm9',
    a: look('m9a', 'Polo et short', ['classic', 'sporty'], 1, [['Polo', '#24314F'], ['Short', '#C9A982'], ['Baskets', '#F5F3EE'], ['Lunettes', '#1B1B1F']],
      'navy knit polo, beige chino shorts, white sneakers, black sunglasses'),
    b: look('m9b', 'T-shirt oversize', ['street'], 1, [['T-shirt oversize', '#1B1B1F'], ['Short cargo', '#9C9A95'], ['Baskets montantes', '#F5F3EE'], ['Sac banane', '#1B1B1F']],
      'black oversized tee, grey cargo shorts, white high-top sneakers, black belt bag') },
  { id: 'm10',
    a: look('m10a', 'Soirée habillée', ['chic'], 3, [['Costume', '#1B1B1F'], ['Chemise', '#F5F3EE'], ['Derbies', '#1B1B1F'], ['Montre', '#9C9A95']],
      'black slim suit, white shirt without tie, black derby shoes, silver watch'),
    b: look('m10b', 'Soirée cool', ['street', 'rock'], 1, [['Veste en jean', '#3E68C9'], ['T-shirt', '#1B1B1F'], ['Jean noir', '#1B1B1F'], ['Baskets', '#F5F3EE']],
      'blue denim jacket, black tee, black jeans, white sneakers') },
];

export function duelsFor(wardrobe: string | undefined): Duel[] {
  if (wardrobe === 'men') return DUELS_MEN;
  // « Les deux » : on alterne un duel femme et un duel homme pour couvrir tous les styles.
  if (wardrobe === 'both') return DUELS_WOMEN.slice(0, 5).flatMap((w, k) => [w, DUELS_MEN[k]]);
  return DUELS_WOMEN;
}

/** Transforme les choix en styles préférés (les 3 plus choisis). */
export function stylesFromDuels(duels: Duel[], choices: { duelId: string; picked: 'a' | 'b' | 'none' }[]): string[] {
  const score: Record<string, number> = {};
  for (const c of choices) {
    const d = duels.find((x) => x.id === c.duelId);
    if (!d || c.picked === 'none') continue;
    const won = c.picked === 'a' ? d.a : d.b;
    const lost = c.picked === 'a' ? d.b : d.a;
    won.styles.forEach((s) => { score[s] = (score[s] ?? 0) + 1; });
    lost.styles.forEach((s) => { score[s] = (score[s] ?? 0) - 0.3; });
  }
  return Object.entries(score).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
}
