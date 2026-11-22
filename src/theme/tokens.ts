/**
 * Identité visuelle « le magazine du matin ».
 *
 * TOUT le style de l'appli part de ce fichier : changer une couleur ici la change partout.
 * Règle : aucun code couleur en dur dans les écrans, on passe toujours par `useTheme()`.
 */

export const palette = {
  cobalt: '#2B44C6', // couleur principale : boutons importants, éléments actifs
  cobaltSoft: '#E9ECFB',
  coral: '#FF5A3C', // accent : stickers, humeur, bouton Ajouter (texte encre dessus)
  butter: '#F6D867', // petits badges, météo (texte encre dessus)
  ink: '#15151C',
  paper: '#F6F3EE',
  paperRaised: '#FFFDF9',
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
  chipBorder: string;
  track: string;
  danger: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: palette.paper,
  surface: palette.paperRaised,
  surfaceBorder: '#ECE6DB',
  divider: '#F0EBE2',
  text: palette.ink,
  textMuted: '#5F5B53',
  textSubtle: '#9A9387',
  primary: palette.cobalt,
  primarySoft: palette.cobaltSoft,
  onPrimary: palette.white,
  accent: palette.coral,
  onAccent: palette.ink,
  highlight: palette.butter,
  onHighlight: palette.ink,
  inverse: palette.ink,
  onInverse: palette.paper,
  chipBorder: '#DCD5C8',
  track: '#D3CBBD',
  danger: palette.danger,
  shadow: '#15151C',
};

export const darkColors: ThemeColors = {
  background: '#121218',
  surface: '#1C1C24',
  surfaceBorder: '#2A2A34',
  divider: '#262630',
  text: '#F3F0EA',
  textMuted: '#ADA79C',
  textSubtle: '#7D776D',
  primary: '#6F84F0',
  primarySoft: '#232A52',
  onPrimary: '#0E1030',
  accent: palette.coral,
  onAccent: palette.ink,
  highlight: palette.butter,
  onHighlight: palette.ink,
  inverse: palette.paper,
  onInverse: palette.ink,
  chipBorder: '#34343F',
  track: '#3A3A44',
  danger: '#FF8A80',
  shadow: '#000000',
};

export const fonts = {
  display: 'Syne_800ExtraBold',
  displayBold: 'Syne_700Bold',
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
