import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { GarmentTile } from '@/components/GarmentTile';
import { PressableScale } from '@/components/PressableScale';
import { IconButton, Screen, Sticker } from '@/components/ui';
import { outfitTint, readableOn } from '@/lib/color';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';
import { MOODS, type Garment } from '@/types';

/** Détail d'un look porté (depuis l'Historique). */
export default function LookScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { history, wardrobe } = useStore();
  const entry = history.find((h) => h.date === date);
  const byId = new Map(wardrobe.map((g) => [g.id, g]));

  if (!entry) {
    return (
      <Screen>
        <View style={{ padding: 20, gap: 16 }}>
          <IconButton icon="chevronLeft" label="Retour" onPress={() => router.back()} />
          <AppText muted>Ce look n’est plus dans ton historique.</AppText>
        </View>
      </Screen>
    );
  }

  const pieces = entry.outfit.garmentIds.map((id) => byId.get(id)).filter((g): g is Garment => !!g);
  const tint = outfitTint(pieces.map((p) => p.colorHex), colors.background, 0.3);
  const ink = readableOn(tint);
  const d = new Date(entry.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const mood = MOODS.find((m) => m.id === entry.mood)?.label ?? 'IA libre';
  const tileW = (width - 40 - 32 - 8) / 2;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <IconButton icon="chevronLeft" label="Retour" onPress={() => router.back()} />
        <AppText variant="eyebrow">{d}</AppText>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ backgroundColor: tint, borderRadius: 28, padding: 16, gap: 14 }}>
          <View style={{ gap: 6 }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 33 }} color={ink}>{entry.outfit.name}</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Sticker label={mood} rotate={-3} />
              <Sticker tone="highlight" label={`${entry.tempC}°`} rotate={3} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {pieces.map((p, k) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(100 + k * motion.stagger).duration(motion.slow)} style={{ width: tileW }}>
                <PressableScale pressedScale={0.96} accessibilityRole="button" accessibilityLabel={p.label} onPress={() => router.push(`/vetement/${p.id}`)}>
                  <GarmentTile garment={p} />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
          {pieces.length < entry.outfit.garmentIds.length ? (
            <AppText variant="small" color={ink} style={{ opacity: 0.75 }}>
              {entry.outfit.garmentIds.length - pieces.length > 1
                ? `${entry.outfit.garmentIds.length - pieces.length} pièces de ce look ne sont plus dans ta garde-robe.`
                : 'Une pièce de ce look n’est plus dans ta garde-robe.'}
            </AppText>
          ) : null}
        </Animated.View>
        {entry.outfit.tip ? (
          <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 40 }} color={colors.accent}>“</AppText>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="eyebrow">Le mot du styliste</AppText>
              <AppText variant="small">{entry.outfit.tip}</AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
