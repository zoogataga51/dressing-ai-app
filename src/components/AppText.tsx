import { Text, type TextProps, type TextStyle } from 'react-native';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export type TextVariant =
  | 'hero' // gros titre d'écran (DM Serif Display 30)
  | 'title' // titre de carte (DM Serif Display 26)
  | 'heading' // sous-titre (DM Serif Display 18)
  | 'eyebrow' // petite ligne en capitales espacées
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'tiny';

const variants: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.3 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 29, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 22 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase' },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14 },
};

type Props = TextProps & { variant?: TextVariant; color?: string; muted?: boolean };

export function AppText({ variant = 'body', color, muted, style, ...rest }: Props) {
  const { colors } = useTheme();
  const tint = color ?? (muted || variant === 'eyebrow' ? colors.textMuted : colors.text);
  return <Text {...rest} style={[variants[variant], { color: tint }, style]} />;
}
