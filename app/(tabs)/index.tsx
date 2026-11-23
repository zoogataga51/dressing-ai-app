import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeOut, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { GarmentTile } from '@/components/GarmentTile';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Button, Chip, IconButton, Screen, Sticker } from '@/components/ui';
import { MOCK_WEATHER } from '@/data/mock';
import { outfitTint, readableMutedOn, readableOn } from '@/lib/color';
import { getAccess } from '@/lib/access';
import { fetchAiOutfits } from '@/lib/ai';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { localDate } from '@/lib/date';
import { generateOutfits, prefsFromAnswers } from '@/lib/outfitEngine';
import { getTodayWeather } from '@/lib/weather';
import { useStore } from '@/state/AppStore';
import { useAuth } from '@/state/AuthStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion, space } from '@/theme/tokens';
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
        <AppText variant="eyebrow" color={colors.primary} style={{ fontFamily: fonts.bodyBold, letterSpacing: 1.7 }}>
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

/** Carte d'attente pendant que l'IA compose les looks (quelques secondes). */
function StylistLoading({ width }: { width: number }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);
  useEffect(() => { pulse.value = withRepeat(withTiming(1, { duration: motion.slow * 2 }), -1, true); }, [pulse]);
  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View entering={FadeIn.duration(motion.base)} style={{ marginHorizontal: SIDE, width, height: 360, borderRadius: 28, backgroundColor: colors.surface,
      padding: 20, gap: 14, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={anim}><Icon name="sparkle" size={36} color={colors.primary} /></Animated.View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>Ton styliste compose tes looks…</AppText>
      <AppText muted style={{ textAlign: 'center' }}>Il regarde la météo, ton humeur et ce que tu as porté ces derniers jours.</AppText>
    </Animated.View>
  );
}

const AI_TIMEOUT = 15_000;
const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

export default function TodayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { wardrobe, profile, wearOutfit, history } = useStore();
  const { userId, anonymous } = useAuth();
  const { width: screenW } = useWindowDimensions();
  const cardW = screenW - SIDE * 2;
  const [weather, setWeather] = useState<Weather>({ ...MOCK_WEATHER, city: profile.city || MOCK_WEATHER.city });
  const [weatherReady, setWeatherReady] = useState(false);
  useEffect(() => {
    let alive = true;
    getTodayWeather(profile.city || 'Paris').then((w) => { if (alive && w) setWeather(w); }).finally(() => { if (alive) setWeatherReady(true); });
    return () => { alive = false; };
  }, [profile.city]);

  const [mood, setMood] = useState<Mood>('free');
  const [active, setActive] = useState(0);
  const today = localDate();
  const wornToday = history.find((h) => h.date === today);

  const ruleOutfits = useMemo(() => generateOutfits(wardrobe, weather, mood, 3, prefsFromAnswers(profile.answers)), [mood, wardrobe.length, weather.tempC, weather.condition, profile.answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avec un compte : looks composés par l'IA (gardés en mémoire par humeur). Sinon, ou en cas d'échec : moteur par règles.
  const aiKey = `${today}:${mood}`;
  const [aiLooks, setAiLooks] = useState<Record<string, Outfit[] | null>>({});
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // Fin de l'essai sans abonnement : la garde-robe reste, mais plus de looks (règle aussi vérifiée par le serveur).
  const locked = !!userId && getAccess(profile).state === 'expired';
  const useAi = !!userId && !locked && ruleOutfits.length > 0;
  const aiPending = useAi && !(aiKey in aiLooks);
  useEffect(() => {
    if (!useAi || !weatherReady || aiKey in aiLooks) return;
    let alive = true;
    withTimeout(fetchAiOutfits(mood, weather, wardrobe), AI_TIMEOUT, null).then((list) => {
      if (alive) setAiLooks((m) => ({ ...m, [aiKey]: list }));
    });
    return () => { alive = false; };
  }, [useAi, weatherReady, aiKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const outfits = (useAi ? aiLooks[aiKey] ?? (aiPending ? [] : ruleOutfits) : ruleOutfits).filter((o) => !hidden.has(o.id));

  // « Pas pour moi » : on retire le look et, s'il vient de l'IA, on s'en souvient pour les prochains jours.
  const dislike = (o: Outfit) => {
    setHidden((h) => new Set(h).add(o.id));
    setActive(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    track('outfit_disliked', { source: o.source ?? 'rules', mood });
    if (o.source === 'ai' && supabase) supabase.from('outfits').update({ status: 'disliked' }).eq('id', o.id).then(() => {}, () => {});
  };
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

        {locked ? (
          <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ marginHorizontal: SIDE, padding: 22, borderRadius: 28, backgroundColor: colors.inverse, gap: 12 }}>
            <Sticker label="Essai terminé" tone="highlight" rotate={-3} style={{ alignSelf: 'flex-start' }} />
            <AppText variant="title" color={colors.onInverse}>Tes looks t’attendent.</AppText>
            <AppText color={colors.onInverse} style={{ opacity: 0.8 }}>
              Tes 7 jours d’essai sont finis. Ta garde-robe reste là, bien rangée : passe à Premium pour retrouver tes looks chaque matin.
            </AppText>
            <Button label="Voir les offres" kind="accent" onPress={() => router.push('/abonnement')} />
          </Animated.View>
        ) : aiPending ? (
          <StylistLoading width={cardW} />
        ) : outfits.length === 0 && ruleOutfits.length > 0 ? (
          <View style={{ marginHorizontal: SIDE, padding: 20, borderRadius: 28, backgroundColor: colors.surface, gap: 8 }}>
            <AppText variant="heading">C’est noté</AppText>
            <AppText muted>On retient ce que tu n’aimes pas. Change d’humeur ci-dessous pour d’autres idées.</AppText>
          </View>
        ) : outfits.length === 0 ? (
          <View style={{ marginHorizontal: SIDE, padding: 20, borderRadius: 28, backgroundColor: colors.surface, gap: 8 }}>
            <AppText variant="heading">Encore quelques pièces</AppText>
            <AppText muted>Ajoute au moins un haut, un bas et une paire de chaussures pour recevoir ton premier look.</AppText>
            <Button label="Ajouter des pièces" icon="camera" onPress={() => router.push('/ajout')} style={{ marginTop: 6 }} />
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

        {locked ? null : (<>
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
            <View style={{ gap: 6 }}>
            <Button label="Je porte ce look" disabled={!outfits[active]} onPress={() => { if (!outfits[active]) return; wearOutfit(outfits[active], mood, weather.tempC); track('outfit_worn', { position: active + 1, mood, source: outfits[active].source ?? 'rules' }); }} />
            {outfits[active] ? (
              <PressableScale onPress={() => dislike(outfits[active])} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 }}>
                <AppText variant="smallStrong" muted>Pas pour moi</AppText>
              </PressableScale>
            ) : null}
            </View>
          )}
        </View>

        {anonymous && wardrobe.length >= 5 ? (
          <PressableScale onPress={() => router.push('/onboarding/connexion?mode=link')}
            style={{ marginHorizontal: SIDE, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.primarySoft }}>
            <Icon name="user" size={20} color={colors.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="smallStrong">Sécurise ta garde-robe</AppText>
              <AppText variant="small" muted>Ajoute ton e-mail pour la retrouver sur n’importe quel téléphone.</AppText>
            </View>
            <Icon name="chevronRight" size={18} color={colors.primary} />
          </PressableScale>
        ) : null}

        {outfits[active]?.tip ? (
          <Animated.View key={outfits[active].id} entering={FadeInDown.duration(motion.base)}
            style={{ marginHorizontal: SIDE, flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 46, color: colors.accent }}>“</AppText>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="eyebrow">Le mot du styliste</AppText>
              <AppText variant="small">{outfits[active].tip}</AppText>
            </View>
          </Animated.View>
        ) : null}
        </>)}
      </ScrollView>
    </Screen>
  );
}
