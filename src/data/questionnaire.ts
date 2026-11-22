/**
 * Questionnaire de style (inscription).
 *
 * Principes :
 *  - une question par écran, réponse en un ou deux appuis ;
 *  - jamais de jugement sur le corps : on demande ce que la personne AIME mettre en valeur,
 *    et les questions de silhouette sont facultatives ;
 *  - chaque réponse sert à composer les looks (le champ `usage` dit à quoi elle sert) ;
 *  - les styles aimés sont déduits des duels de looks (src/data/duels.ts), pas demandés ici.
 *
 * La liste sera raccourcie après la bêta, en regardant où les gens abandonnent.
 */

export type Option = { id: string; label: string; hint?: string; swatch?: string };

export type Question = {
  id: string;
  section: 'Toi' | 'Ton quotidien' | 'Tes goûts' | 'Ta silhouette' | 'Tes humeurs';
  title: string;
  subtitle?: string;
  kind: 'single' | 'multi' | 'text';
  options?: Option[];
  /** Nombre max de choix pour une question multiple. */
  max?: number;
  optional?: boolean;
  placeholder?: string;
  /** Option qui désélectionne toutes les autres (« Aucune », « Rien de particulier »). */
  exclusiveOptionId?: string;
  usage: string;
};

const COLORS: Option[] = [
  { id: 'black', label: 'Noir', swatch: '#1B1B1F' },
  { id: 'white', label: 'Blanc', swatch: '#F5F3EE' },
  { id: 'beige', label: 'Beige et camel', swatch: '#C9A982' },
  { id: 'grey', label: 'Gris', swatch: '#9C9A95' },
  { id: 'navy', label: 'Marine', swatch: '#24314F' },
  { id: 'blue', label: 'Bleu', swatch: '#3E68C9' },
  { id: 'green', label: 'Vert et kaki', swatch: '#5E7451' },
  { id: 'brown', label: 'Marron', swatch: '#6B4A33' },
  { id: 'red', label: 'Rouge et bordeaux', swatch: '#9E2B32' },
  { id: 'pink', label: 'Rose', swatch: '#E5A3B8' },
  { id: 'yellow', label: 'Jaune et moutarde', swatch: '#D9A93A' },
  { id: 'purple', label: 'Violet et prune', swatch: '#6E3B55' },
  { id: 'pastel', label: 'Pastels', swatch: '#CFE0F2' },
  { id: 'bright', label: 'Couleurs vives', swatch: '#FF5A3C' },
];

export const QUESTIONS: Question[] = [
  // — Toi —
  { id: 'firstName', section: 'Toi', kind: 'text', title: 'Comment tu t’appelles ?', subtitle: 'Juste ton prénom, pour te dire bonjour le matin.',
    placeholder: 'Ton prénom', usage: 'Personnalisation des messages et de la notification.' },
  { id: 'wardrobe', section: 'Toi', kind: 'single', title: 'Tu t’habilles plutôt au rayon…', subtitle: 'Ça nous aide à te montrer les bons looks.',
    options: [
      { id: 'women', label: 'Femme' },
      { id: 'men', label: 'Homme' },
      { id: 'both', label: 'Les deux', hint: 'Je pioche partout' },
    ], usage: 'Choix de la série de duels et du vocabulaire des conseils.' },
  { id: 'city', section: 'Toi', kind: 'text', title: 'Tu vis dans quelle ville ?', subtitle: 'Pour adapter chaque look à la météo du jour.',
    placeholder: 'Ex. : Lyon', usage: 'Météo quotidienne.' },

  // — Ton quotidien —
  { id: 'week', section: 'Ton quotidien', kind: 'multi', title: 'À quoi ressemble ta semaine ?', subtitle: 'Choisis tout ce qui te correspond.',
    options: [
      { id: 'school', label: 'Cours ou études' },
      { id: 'office', label: 'Bureau' },
      { id: 'remote', label: 'Télétravail' },
      { id: 'onfeet', label: 'Travail debout ou physique' },
      { id: 'kids', label: 'Enfants à gérer' },
      { id: 'nightout', label: 'Sorties le soir' },
      { id: 'sport', label: 'Sport' },
    ], usage: 'Niveau d’habillé et confort des looks en semaine.' },
  { id: 'dresscode', section: 'Ton quotidien', kind: 'single', title: 'Au travail ou en cours, il y a un code vestimentaire ?',
    options: [
      { id: 'none', label: 'Aucun', hint: 'Je mets ce que je veux' },
      { id: 'casual', label: 'Décontracté' },
      { id: 'smart', label: 'Smart casual', hint: 'Soigné sans costume' },
      { id: 'formal', label: 'Formel', hint: 'Costume, tailleur' },
      { id: 'uniform', label: 'Tenue de travail imposée' },
    ], usage: 'Bornes de formalité les jours de semaine.' },
  { id: 'morningTime', section: 'Ton quotidien', kind: 'single', title: 'Le matin, tu as combien de temps pour t’habiller ?',
    options: [
      { id: 'rush', label: 'Moins de 5 minutes', hint: 'Toujours à la bourre' },
      { id: 'normal', label: '5 à 15 minutes' },
      { id: 'slow', label: 'Je prends mon temps' },
    ], usage: 'Complexité des looks (superpositions, accessoires).' },
  { id: 'coverage', section: 'Ton quotidien', kind: 'multi', title: 'Tu as des préférences de couverture ?', subtitle: 'On les respectera dans chaque look.',
    exclusiveOptionId: 'none',
    options: [
      { id: 'none', label: 'Rien de particulier' },
      { id: 'shoulders', label: 'Épaules couvertes' },
      { id: 'legs', label: 'Jambes couvertes' },
      { id: 'neckline', label: 'Pas de décolleté' },
      { id: 'loose', label: 'Tenues amples' },
      { id: 'hijab', label: 'Je porte le voile' },
    ], usage: 'Règles strictes : aucune tenue proposée ne doit les enfreindre.' },

  // — Tes goûts —
  { id: 'image', section: 'Tes goûts', kind: 'multi', max: 2, title: 'Avec tes tenues, tu veux qu’on te trouve…', subtitle: 'Deux choix maximum.',
    options: [
      { id: 'elegant', label: 'Élégant·e' },
      { id: 'cool', label: 'Cool' },
      { id: 'original', label: 'Original·e' },
      { id: 'neat', label: 'Discret·e et soigné·e' },
      { id: 'comfy', label: 'Bien dans mes baskets', hint: 'Le confort d’abord' },
      { id: 'sexy', label: 'Séduisant·e' },
    ], usage: 'Ton général des looks et des noms de looks.' },
  { id: 'colorsLoved', section: 'Tes goûts', kind: 'multi', title: 'Les couleurs que tu aimes porter', options: COLORS,
    usage: 'Couleurs favorisées dans les associations.' },
  { id: 'colorsAvoid', section: 'Tes goûts', kind: 'multi', title: 'Et celles que tu évites', exclusiveOptionId: 'none',
    options: [{ id: 'none', label: 'Aucune, j’aime tout' }, ...COLORS], usage: 'Couleurs évitées autant que possible.' },
  { id: 'prints', section: 'Tes goûts', kind: 'single', title: 'Les imprimés (rayures, carreaux, fleurs…) ?',
    options: [
      { id: 'love', label: 'J’adore' },
      { id: 'some', label: 'Avec modération', hint: 'Un seul par tenue' },
      { id: 'plain', label: 'Uni seulement' },
    ], usage: 'Nombre maximal de pièces à motif par look.' },
  { id: 'boldness', section: 'Tes goûts', kind: 'single', title: 'Côté audace, on fait comment ?',
    options: [
      { id: 'safe', label: 'Je reste dans ma zone de confort' },
      { id: 'bit', label: 'Un peu de nouveauté, ça me va' },
      { id: 'surprise', label: 'Surprends-moi' },
    ], usage: 'Part d’associations inhabituelles parmi les 3 looks du jour.' },

  // — Ta silhouette (facultatif) —
  { id: 'fits', section: 'Ta silhouette', kind: 'multi', title: 'Les coupes dans lesquelles tu te sens bien',
    options: [
      { id: 'slim', label: 'Ajusté' },
      { id: 'regular', label: 'Droit' },
      { id: 'loose', label: 'Ample' },
      { id: 'oversize', label: 'Oversize' },
    ], usage: 'Équilibre des volumes haut/bas.' },
  { id: 'highlight', section: 'Ta silhouette', kind: 'multi', optional: true, title: 'Ce que tu aimes mettre en valeur', subtitle: 'Facultatif.',
    exclusiveOptionId: 'nothing',
    options: [
      { id: 'waist', label: 'La taille' },
      { id: 'legs', label: 'Les jambes' },
      { id: 'shoulders', label: 'Les épaules' },
      { id: 'arms', label: 'Les bras' },
      { id: 'nothing', label: 'Rien en particulier' },
    ], usage: 'Choix des coupes et de la façon de porter (rentré, ceinturé…).' },
  { id: 'height', section: 'Ta silhouette', kind: 'single', optional: true, title: 'Ta taille ?', subtitle: 'Facultatif, pour les proportions.',
    options: [
      { id: 'short', label: 'Moins de 1,60 m' },
      { id: 'medium', label: 'Entre 1,60 et 1,75 m' },
      { id: 'tall', label: 'Plus de 1,75 m' },
    ], usage: 'Longueurs et proportions (ex. : éviter de couper la silhouette).' },
  { id: 'shoes', section: 'Ta silhouette', kind: 'multi', title: 'Les chaussures que tu portes le plus',
    options: [
      { id: 'sneakers', label: 'Baskets' },
      { id: 'boots', label: 'Bottines et boots' },
      { id: 'loafers', label: 'Mocassins et derbies' },
      { id: 'heels', label: 'Talons' },
      { id: 'flats', label: 'Ballerines' },
      { id: 'sandals', label: 'Sandales' },
    ], usage: 'Préférence de chaussures à garde-robe égale.' },
  { id: 'accessories', section: 'Ta silhouette', kind: 'multi', title: 'Tes accessoires du quotidien', exclusiveOptionId: 'none',
    options: [
      { id: 'cap', label: 'Casquette ou bonnet' },
      { id: 'bag', label: 'Sac' },
      { id: 'hijab', label: 'Voile' },
      { id: 'jewelry', label: 'Bijoux' },
      { id: 'belt', label: 'Ceinture' },
      { id: 'scarf', label: 'Écharpe ou foulard' },
      { id: 'none', label: 'Pas trop mon truc' },
    ], usage: 'Ajout d’accessoires dans les looks.' },

  // — Tes humeurs —
  { id: 'goodMood', section: 'Tes humeurs', kind: 'single', title: 'Les jours où tu es de bonne humeur, tu portes…',
    options: [
      { id: 'color', label: 'De la couleur' },
      { id: 'favorite', label: 'Ma pièce préférée' },
      { id: 'dressy', label: 'Plus habillé que d’habitude' },
      { id: 'same', label: 'Rien ne change' },
    ], usage: 'Traduction de l’humeur « Chaleureux » / « Audacieux ».' },
  { id: 'confidence', section: 'Tes humeurs', kind: 'single', title: 'Un jour où tu as besoin de confiance',
    options: [
      { id: 'black', label: 'Une tenue noire, nette' },
      { id: 'statement', label: 'Une pièce forte qui se remarque' },
      { id: 'comfort', label: 'Mon confort absolu' },
      { id: 'sharp', label: 'Très habillé, impeccable' },
    ], usage: 'Traduction de l’humeur « Chic ».' },
  { id: 'lazy', section: 'Tes humeurs', kind: 'single', title: 'Et les jours de flemme ?',
    options: [
      { id: 'jogging', label: 'Jogging assumé' },
      { id: 'jeans', label: 'Jean et sweat' },
      { id: 'dress', label: 'Une robe simple, c’est réglé' },
      { id: 'effort', label: 'Je fais quand même un effort' },
    ], usage: 'Traduction de l’humeur « Décontracté ».' },
];

/** Styles déduits des duels (affichés dans le Profil). */
export const STYLE_OPTIONS: Option[] = [
  { id: 'classic', label: 'Classique' },
  { id: 'street', label: 'Streetwear' },
  { id: 'minimal', label: 'Minimaliste' },
  { id: 'chic', label: 'Chic' },
  { id: 'modest', label: 'Modeste' },
  { id: 'boho', label: 'Bohème' },
  { id: 'sporty', label: 'Sportswear' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'rock', label: 'Rock' },
  { id: 'colorful', label: 'Coloré' },
];

export const STYLE_OPTIONS_BY_ID: Record<string, Option> = Object.fromEntries(STYLE_OPTIONS.map((o) => [o.id, o]));
