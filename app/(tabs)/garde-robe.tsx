import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { GarmentTile } from '@/components/GarmentTile';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Chip, IconButton, Screen } from '@/components/ui';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion, space } from '@/theme/tokens';
import { CATEGORY_LABELS, type Category } from '@/types';

const FILTERS: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'top', label: 'Hauts' },
  { id: 'bottom', label: 'Bas' },
  { id: 'dress', label: 'Robes' },
  { id: 'outer', label: 'Vestes' },
  { id: 'shoes', label: 'Chaussures' },
  { id: 'accessory', label: 'Accessoires' },
];

export default function WardrobeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { wardrobe } = useStore();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wardrobe.filter((g) => (filter === 'all' || g.category === filter)
      && (!q || `${g.label} ${g.colorName} ${g.subtype} ${g.material}`.toLowerCase().includes(q)));
  }, [wardrobe, filter, query]);
  const forgotten = wardrobe.filter((g) => !g.lastWornAt || Date.now() - new Date(g.lastWornAt).getTime() > 30 * 86_400_000).length;
  const tileW = (width - 40 - 20) / 3;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 2 }}>
            <AppText variant="eyebrow">{items.length} {items.length > 1 ? 'pièces' : 'pièce'}{filter !== 'all' ? ` · ${CATEGORY_LABELS[filter]}` : ''}</AppText>
            <AppText variant="hero">Ma garde-robe</AppText>
          </View>
          <IconButton icon={searching ? 'close' : 'search'} label={searching ? 'Fermer la recherche' : 'Rechercher'} onPress={() => { setSearching((v) => !v); setQuery(''); }} />
        </View>
        {searching ? (
          <Animated.View entering={FadeInUp.duration(motion.base)} exiting={FadeOutUp.duration(motion.fast)}>
            <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Un vêtement, une couleur…" placeholderTextColor={colors.textSubtle}
              returnKeyType="search" style={{ height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.chipBorder, backgroundColor: colors.surface,
                paddingHorizontal: 14, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text }} />
          </Animated.View>
        ) : null}
        {!searching && forgotten > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.highlight, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, transform: [{ rotate: '-1deg' }] }}>
            <Icon name="sparkle" size={20} color={colors.onHighlight} />
            <AppText variant="smallStrong" color={colors.onHighlight} style={{ flex: 1 }}>
              {forgotten} {forgotten > 1 ? 'pièces à ressortir' : 'pièce à ressortir'} : on les glisse dans tes prochains looks.
            </AppText>
          </View>
        ) : null}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: space.md }}>
          {FILTERS.map((f) => <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />)}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}>
        <View key={filter} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {items.map((g, k) => (
            <Animated.View key={g.id} entering={FadeInDown.delay(Math.min(k, 9) * 35).duration(motion.base)} layout={LinearTransition}
              style={{ width: tileW }}>
              <PressableScale accessibilityRole="button" accessibilityLabel={g.label} pressedScale={0.95} onPress={() => router.push(`/vetement/${g.id}`)} style={{ gap: 6 }}>
                <GarmentTile garment={g} height={108} showLabel={false} iconSize={46} />
                <AppText variant="smallStrong" numberOfLines={1} style={{ fontSize: 12 }}>{g.label}</AppText>
              </PressableScale>
            </Animated.View>
          ))}
        </View>
        {items.length === 0 ? (
          <AppText muted style={{ textAlign: 'center', marginTop: 40 }}>{query ? 'Aucune pièce ne correspond.' : 'Rien ici pour l’instant. Ajoute ta première pièce !'}</AppText>
        ) : null}
      </ScrollView>

      <Animated.View entering={ZoomIn.delay(200).springify()} style={{ position: 'absolute', right: 20, bottom: 20 }}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Ajouter un vêtement" haptic="medium" onPress={() => router.push('/ajout')}
          style={{ height: 54, paddingLeft: 18, paddingRight: 22, borderRadius: 27, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: 8,
            shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 5 }}>
          <Icon name="plus" size={20} color={colors.onAccent} strokeWidth={2.2} />
          <AppText variant="bodyStrong" color={colors.onAccent}>Ajouter</AppText>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}
