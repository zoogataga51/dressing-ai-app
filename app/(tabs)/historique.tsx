import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/ui';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion, space } from '@/theme/tokens';
import { MOODS } from '@/types';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { history, wardrobe } = useStore();
  const byId = new Map(wardrobe.map((g) => [g.id, g]));

  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const thisMonth = history.filter((h) => h.date.startsWith(monthKey)).length;
  const mostWorn = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount)[0];
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: space.lg }}>
        <View style={{ gap: 2 }}>
          <AppText variant="eyebrow">{monthName}</AppText>
          <AppText variant="hero">Mes looks</AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ flex: 1, minHeight: 92, backgroundColor: colors.primary, borderRadius: 20, padding: 14, gap: 6 }}>
            <AppText variant="smallStrong" color={colors.onPrimary} style={{ opacity: 0.85 }}>Ce mois-ci</AppText>
            <AppText variant="title" color={colors.onPrimary}>{thisMonth} {thisMonth > 1 ? 'looks' : 'look'}</AppText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(60).duration(motion.slow)} style={{ flex: 1, minHeight: 92, backgroundColor: colors.highlight, borderRadius: 20, padding: 14, gap: 6, transform: [{ rotate: '1deg' }] }}>
            <AppText variant="smallStrong" color={colors.onHighlight} style={{ opacity: 0.8 }}>Pièce la plus portée</AppText>
            <AppText variant="heading" color={colors.onHighlight} numberOfLines={2}>{mostWorn?.label ?? '—'}</AppText>
          </Animated.View>
        </View>

        <View style={{ gap: 10 }}>
          {history.map((h, k) => {
            const d = new Date(h.date + 'T12:00:00');
            const day = d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();
            const swatches = h.outfit.garmentIds.map((id) => byId.get(id)?.colorHex).filter(Boolean).slice(0, 4) as string[];
            const mood = MOODS.find((m) => m.id === h.mood)?.label.toLowerCase();
            return (
              <Animated.View key={h.date} entering={FadeInDown.delay(120 + k * motion.stagger).duration(motion.slow)}>
                <PressableScale pressedScale={0.98} accessibilityRole="button" onPress={() => router.push(`/look/${h.date}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }}>
                  <View style={{ width: 44, alignItems: 'center' }}>
                    <AppText style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 28 }}>{d.getDate()}</AppText>
                    <AppText variant="tiny" muted style={{ letterSpacing: 1 }}>{day}</AppText>
                  </View>
                  <View style={{ width: 64, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {swatches.map((c, i) => <View key={i} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: c }} />)}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <AppText style={{ fontFamily: fonts.display, fontSize: 19 }}>{h.outfit.name}</AppText>
                    <AppText variant="small" muted style={{ fontSize: 12 }}>{h.tempC}° · {h.mood === 'free' ? 'IA libre' : `humeur ${mood}`}</AppText>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
          {history.length === 0 ? <AppText muted>Tes looks portés apparaîtront ici.</AppText> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
