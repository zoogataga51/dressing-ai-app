import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Aujourd’hui', icon: 'sparkle' },
  'garde-robe': { label: 'Garde-robe', icon: 'hanger' },
  historique: { label: 'Historique', icon: 'calendar' },
  profil: { label: 'Profil', icon: 'user' },
};

function TabItem({ focused, label, icon, onPress }: { focused: boolean; label: string; icon: IconName; onPress: () => void }) {
  const { colors } = useTheme();
  const pill = useAnimatedStyle(() => ({
    backgroundColor: withTiming(focused ? colors.primarySoft : 'transparent', { duration: motion.base }),
    transform: [{ scaleX: withSpring(focused ? 1 : 0.6, motion.spring) }],
  }), [focused, colors]);
  const tint = focused ? colors.primary : colors.textMuted;
  return (
    <PressableScale accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} onPress={onPress} haptic="select"
      style={{ alignItems: 'center', gap: 4, minWidth: 72, paddingVertical: 4 }}>
      <View style={{ width: 56, height: 30, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', width: 56, height: 30, borderRadius: 15 }, pill]} />
        <Icon name={icon} color={tint} />
      </View>
      <AppText variant="tiny" color={tint} style={{ fontFamily: focused ? 'Inter_700Bold' : 'Inter_500Medium' }}>{label}</AppText>
    </PressableScale>
  );
}

/** Barre du bas sur mesure : Aujourd'hui, Garde-robe, Historique, Profil. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10),
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceBorder }}>
      {state.routes.map((route, i) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === i;
        return (
          <TabItem key={route.key} focused={focused} label={meta.label} icon={meta.icon}
            onPress={() => { if (!focused) navigateToTab(route.key); }} />
        );
      })}
    </View>
  );
}
