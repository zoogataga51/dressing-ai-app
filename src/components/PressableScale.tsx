import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '@/theme/tokens';

const APressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Échelle quand on appuie (0.95 par défaut). */
  pressedScale?: number;
  haptic?: 'light' | 'medium' | 'select' | 'none';
};

/**
 * Base de tous les éléments cliquables : léger enfoncement + petite vibration.
 * C'est ce qui donne la sensation « vivante » demandée sur chaque appui.
 */
export function PressableScale({ style, children, pressedScale = 0.95, haptic = 'light', onPressIn, onPressOut, onPress, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, motion.spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, motion.spring);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        if (haptic === 'select') Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </APressable>
  );
}
