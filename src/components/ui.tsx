/**
 * Petits composants réutilisables de l'identité « magazine du matin ».
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion, radius, space } from '@/theme/tokens';

/** Fond papier + marges de sécurité (encoche, barre du bas). */
export function Screen({ children, style, edges = ['top'] }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom')[] }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

type ButtonKind = 'primary' | 'accent' | 'inverse' | 'ghost';

export function Button({ label, onPress, kind = 'primary', icon, loading, disabled, style }: {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { primary: colors.primary, accent: colors.accent, inverse: colors.inverse, ghost: 'transparent' }[kind];
  const fg = { primary: colors.onPrimary, accent: colors.onAccent, inverse: colors.onInverse, ghost: colors.primary }[kind];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      haptic="medium"
      style={[
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        kind === 'primary' && { shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Icon name={icon} color={fg} size={20} strokeWidth={2.2} /> : null}
          <AppText variant="bodyStrong" color={fg} style={{ fontSize: 16 }}>{label}</AppText>
        </>
      )}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, label, filled }: { icon: IconName; onPress?: () => void; label: string; filled?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[styles.iconButton, filled
        ? { backgroundColor: colors.inverse }
        : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.chipBorder }]}
    >
      <Icon name={icon} size={18} color={filled ? colors.onInverse : colors.text} />
    </PressableScale>
  );
}

/** Pastille sélectionnable (humeur, catégorie…). La couleur glisse en douceur. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const anim = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? colors.inverse : colors.surface, { duration: motion.base }),
    borderColor: withTiming(selected ? colors.inverse : colors.chipBorder, { duration: motion.base }),
  }), [selected, colors]);
  return (
    <PressableScale accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} haptic="select">
      <Animated.View style={[styles.chip, anim]}>
        <AppText variant="smallStrong" color={selected ? colors.onInverse : colors.text} style={{ fontSize: 14 }}>{label}</AppText>
      </Animated.View>
    </PressableScale>
  );
}

/** Étiquette « sticker » légèrement penchée : la signature visuelle de l'appli. */
export function Sticker({ label, tone = 'accent', rotate = -3, icon, style }: {
  label: string;
  tone?: 'accent' | 'highlight' | 'primary';
  rotate?: number;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { accent: colors.accent, highlight: colors.highlight, primary: colors.primary }[tone];
  const fg = { accent: colors.onAccent, highlight: colors.onHighlight, primary: colors.onPrimary }[tone];
  return (
    <View style={[styles.sticker, { backgroundColor: bg, transform: [{ rotate: `${rotate}deg` }] }, style]}>
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <AppText variant="smallStrong" color={fg} style={{ fontFamily: fonts.bodyBold }}>{label}</AppText>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, style]}>{children}</View>;
}

export function ProgressBar({ value, color, track }: { value: number; color?: string; track?: string }) {
  const { colors } = useTheme();
  const anim = useAnimatedStyle(() => ({ width: withTiming(`${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, { duration: motion.slow }) }), [value]);
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: track ?? colors.track, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color ?? colors.primary }, anim]} />
    </View>
  );
}

/** Ligne de réglage (Profil, fiche vêtement). */
export function Row({ label, value, onPress, danger, right, last }: {
  label: string; value?: string; onPress?: () => void; danger?: boolean; right?: ReactNode; last?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <AppText color={danger ? colors.danger : colors.text} style={{ fontSize: 14, fontFamily: danger ? fonts.bodySemi : fonts.body }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {value ? <AppText variant="smallStrong" style={{ fontSize: 14 }}>{value}</AppText> : null}
        {right}
        {onPress && !right && !danger ? <Icon name="chevronRight" size={14} color={colors.textSubtle} strokeWidth={2} /> : null}
      </View>
    </>
  );
  const style = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }];
  return onPress
    ? <PressableScale accessibilityRole="button" pressedScale={0.98} onPress={onPress} style={style}>{content}</PressableScale>
    : <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  button: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: { height: 40, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  sticker: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, alignSelf: 'flex-start' },
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
