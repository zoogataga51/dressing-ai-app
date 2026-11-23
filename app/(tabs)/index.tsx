import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeInDown, FadeOut, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { GarmentTile } from '@/components/GarmentTile';
import { Icon } from '@/components/Icon';
import { Button, Chip, IconButton, Screen, Sticker } from '@/components/ui';
import { MOCK_WEATHER } from '@/data/mock';
import { outfitTint, readableMutedOn, readableOn } from '@/lib/color';
import { track } from '@/lib/analytics';
import { localDate } from '@/lib/date';
import { generateOutfits } from '@/lib/outfitEngine';
import { getTodayWeather } from '@/lib/weather';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, space } from '@/theme/tokens';
import { MOODS, type Garment, type Mood, type Outfit, type Weather } from '@/types';

const SIDE = 20;
const GAP = 12;

function frenchDate(d = new Date()) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function OutfitCard({ outfit, pieces, index, total, width, scrollX, moodLabel }: {
  outfit: Outfit; pieces: Garment[]; index: number; total: number; width: number;
  scrollX: SharedValue<number>; moodLabel: string;
}) {
  const { colors } = useTheme();
  const tint = outfitTint(pieces.map((p) => p.colorHex), colors.background, 0.3);

  // Effet « carte qu'on fait glisser » : les cartes voisines sont plus petites et penchées.
  const anim = useAnimatedStyle(() => {
    const pos = scrollX.value / (width + GAP) - index;
    return {
      transform: [
        { scale: interpolate(pos, [-1, 0, 1], [0.92, 1, 0.92], 'clamp') },
        { rotate: `${interpolate(pos, [-1, 0, 1], [2, 0, -2], 'clamp')}deg` },
      ],
      opacity: interpolate(Math.abs(pos), [0, 1], [1, 0.55], 'clamp'),
    };
  });

  return (
    <Animated.View style={[{ width, borderRadius: 28, backgroundColor: tint, padding: 16, paddingTop: 18, gap: 14,
      shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 3 }, anim]}>
      <View style={{ paddingRight: 100, gap: 4 }}>
        <AppText variant="eyebrow" color={colors.primary} style={{ fontFamily: 'Syne_700Bold', letterSpacing: 1.7 }}>
          Look 0{index + 1} / 0{total}
        </AppText>
        <AppText variant="title" color={readableOn(tint)}>{outfit.name}</AppText>
        <AppText variant="small" color={readableMutedOn(tint)}>{outfit.vibe}</AppText>
      </View>
      <Animated.View entering={ZoomIn.delay(200).springify()} style={{ position: 'absolute', top: 16, right: 14 }}>
        <Sticker label={moodLabel} rotate={4} />
      </Animated.View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pieces.map((p, k) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(120 + k * motion.stagger).duration(motion.slow)}
            style={{ width: (width - 32 - 8) / 2 }}>
            <GarmentTile garment={p} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const { wardrobe, profile, wearOutfit, history } = useStore();
  const { width: screenW } = useWindowDimensions();
  const cardW = screenW - SIDE * 2;
  const [weather, setWeather] = useState<Weather>({ ...MOCK_WEATHER, city: profile.city || MOCK_WEATHER.city });
  useEffect(() => {
    let alive = true;
    getTodayWeather(profile.city || 'Paris').then((w) => { if (alive && w) setWeather(w); });
    return () => { alive = false; };
  }, [profile.city]);

  const [mood, setMood] = useState<Mood>('free');
  const [active, setActive] = useState(0);
  const today = localDate();
  const wornToday = history.find((h) => h.date === today);

  const outfits = useMemo(() => generateOutfits(wardrobe, weather, mood, 3), [mood, wardrobe.length, weather.tempC, weather.condition]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map(wardrobe.map((g) => [g.id, g])), [wardrobe]);
  const scrollX = useSharedValue(0);
  const listRef = useRef<Animated.FlatList<Outfit> | null>(null);

  const onScroll = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });
  const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? 'IA libre';
  const go = (d: number) => {
    const next = Math.max(0, Math.min(outfits.length - 1, active + d));
    listRef.current?.scrollToOffset({ offset: next * (cardW + GAP), animated: true });
    setActive(next);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28, gap: space.md }}>
        {/* En-tête façon couverture de magazine */}
        <View style={{ paddingHorizontal: SIDE, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2 }}>
            <AppText variant="eyebrow">{frenchDate()}</AppText>
            <AppText variant="hero" style={{ fontSize: 28 }}>Bonjour{profile.firstName ? ` ${profile.firstName}` : ''}</AppText>
          </View>
          <Sticker tone="highlight" icon={weather.condition} label={`${weather.city} · ${weather.tempC}°`} />
        </View>

        {outfits.length === 0 ? (
          <View style={{ marginHorizontal: SIDE, padding: 20, borderRadius: 28, backgroundColor: colors.surface, gap: 8 }}>
            <AppText variant="heading">Encore quelques pièces</AppText>
            <AppText muted>Ajoute au moins un haut, un bas et une paire de chaussures pour recevoir ton premier look.</AppText>
          </View>
        ) : (
          <Animated.FlatList
            ref={listRef}
            data={outfits}
            keyExtractor={(o) => o.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardW + GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP, paddingVertical: 6 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP)))}
            renderItem={({ item, index }) => (
              <OutfitCard outfit={item} index={index} total={outfits.length} width={cardW} scrollX={scrollX} moodLabel={moodLabel}
                pieces={item.garmentIds.map((id) => byId.get(id)).filter((g): g is Garment => !!g)} />
            )}
          />
        )}

        <View style={{ paddingHorizontal: SIDE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {outfits.map((o, k) => (
                <View key={o.id} style={{ height: 6, borderRadius: 3, width: k === active ? 20 : 6, backgroundColor: k === active ? colors.primary : colors.track }} />
              ))}
            </View>
            <AppText variant="small" muted>Glisse pour changer</AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon="chevronLeft" label="Look précédent" onPress={() => go(-1)} />
            <IconButton icon="chevronRight" label="Look suivant" filled onPress={() => go(1)} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIDE, gap: 8 }}>
          {MOODS.map((m) => (
            <Chip key={m.id} label={m.label} selected={m.id === mood} onPress={() => { setMood(m.id); track('mood_changed', { mood: m.id }); setActive(0); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }} />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: SIDE }}>
          {wornToday ? (
            <Animated.View entering={ZoomIn.springify()} exiting={FadeOut}
              style={{ height: 56, borderRadius: 18, backgroundColor: colors.inverse, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={14} color={colors.onHighlight} strokeWidth={2.6} />
              </View>
              <AppText variant="bodyStrong" color={colors.onInverse}>C’est noté : {wornToday.outfit.name}. Belle journée !</AppText>
            </Animated.View>
          ) : (
            <Button label="Je porte ce look" disabled={!outfits[active]} onPress={() => { if (!outfits[active]) return; wearOutfit(outfits[active], mood, weather.tempC); track('outfit_worn', { position: active + 1, mood }); }} />
          )}
        </View>

        {outfits[active]?.tip ? (
          <Animated.View key={outfits[active].id} entering={FadeInDown.duration(motion.base)}
            style={{ marginHorizontal: SIDE, flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }}>
            <AppText style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 40, lineHeight: 40, color: colors.accent }}>“</AppText>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="eyebrow">Le mot du styliste</AppText>
              <AppText variant="small">{outfits[active].tip}</AppText>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
