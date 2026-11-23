/**
 * Identité visuelle « le magazine du matin » — palette « bleu nuit & kaki » (choix du fondateur, 2026-11-23).
 *
 * TOUT le style de l'appli part de ce fichier : changer une couleur ici la change partout.
 * Règle : aucun code couleur en dur dans les écrans, on passe toujours par `useTheme()`.
 */

export const palette = {
  night: '#1F2B4D', // bleu nuit : couleur principale (boutons importants, éléments actifs, en-tête Premium)
  nightSoft: '#E3E6EF',
  khaki: '#8C9C7E', // vert kaki : accent (stickers, humeur, bouton Premium ; texte encre dessus)
  sand: '#F4DDAE', // sable : petits badges, météo (texte encre dessus)
  ink: '#141A2B',
  paper: '#F5F2EE',
  paperRaised: '#FFFDFA',
  danger: '#B3261E',
  white: '#FFFFFF',
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceBorder: string;
  divider: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  highlight: string;
  onHighlight: string;
  inverse: string;
  onInverse: string;
  /** Couleur de marque, identique en mode clair et sombre (en-tête Premium). */
  brand: string;
  onBrand: string;
  chipBorder: string;
  track: string;
  danger: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: palette.paper,
  surface: palette.paperRaised,
  surfaceBorder: '#E6E2DA',
  divider: '#EEEAE3',
  text: palette.ink,
  textMuted: '#5D6170',
  textSubtle: '#9497A3',
  primary: palette.night,
  primarySoft: palette.nightSoft,
  onPrimary: palette.white,
  accent: palette.khaki,
  onAccent: palette.ink,
  highlight: palette.sand,
  onHighlight: palette.ink,
  inverse: palette.ink,
  onInverse: palette.paper,
  brand: palette.night,
  onBrand: palette.white,
  chipBorder: '#D8D5CE',
  track: '#CFCBC3',
  danger: palette.danger,
  shadow: palette.ink,
};

export const darkColors: ThemeColors = {
  background: '#0F1320',
  surface: '#171C2C',
  surfaceBorder: '#252B3E',
  divider: '#1F2536',
  text: '#EEF0F6',
  textMuted: '#A6ABBD',
  textSubtle: '#737990',
  primary: '#8FA3E0',
  primarySoft: '#1E2742',
  onPrimary: '#0F1320',
  accent: '#A3B394',
  onAccent: '#0F1320',
  highlight: palette.sand,
  onHighlight: palette.ink,
  inverse: '#EEF0F6',
  onInverse: '#0F1320',
  brand: palette.night,
  onBrand: palette.white,
  chipBorder: '#2E3548',
  track: '#343B50',
  danger: '#FF8A80',
  shadow: '#000000',
};

export const fonts = {
  display: 'DMSerifDisplay_400Regular', // titres : serif élégante (une seule graisse)
  displayBold: 'DMSerifDisplay_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Durées des animations : courtes, le matin les gens sont pressés. */
export const motion = {
  fast: 160,
  base: 260,
  slow: 420,
  stagger: 55,
  spring: { damping: 16, stiffness: 220, mass: 0.8 },
} as const;
