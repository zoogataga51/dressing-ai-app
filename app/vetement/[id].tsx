import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { GarmentTile } from '@/components/GarmentTile';
import { Button, Chip, IconButton, Screen, Sticker } from '@/components/ui';
import { CATEGORY_OPTIONS, COLOR_OPTIONS, FIT_OPTIONS, SEASON_OPTIONS } from '@/data/garmentOptions';
import { track } from '@/lib/analytics';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';
import type { Garment } from '@/types';

function lastWornText(date?: string) {
  if (!date) return 'Jamais portée avec Dressing AI';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return 'Portée aujourd’hui';
  if (days === 1) return 'Portée hier';
  return `Portée il y a ${days} jours`;
}

/** Fiche d'un vêtement : voir, corriger, supprimer. */
export default function GarmentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wardrobe, updateGarment, removeGarment } = useStore();
  const g = wardrobe.find((x) => x.id === id);

  if (!g) {
    return (
      <Screen>
        <View style={{ padding: 20, gap: 16 }}>
          <IconButton icon="chevronLeft" label="Retour" onPress={() => router.back()} />
          <AppText muted>Ce vêtement n’existe plus.</AppText>
        </View>
      </Screen>
    );
  }

  const set = (patch: Partial<Garment>) => {
    updateGarment(g.id, patch);
    track('garment_edited', { field: Object.keys(patch)[0] });
  };

  const remove = () =>
    Alert.alert('Retirer ce vêtement ?', 'Il ne sera plus proposé dans tes looks.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => { removeGarment(g.id); track('garment_removed'); router.back(); } },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <IconButton icon="chevronLeft" label="Retour" onPress={() => router.back()} />
        <AppText style={{ fontFamily: fonts.display, fontSize: 18 }}>Ma pièce</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }}>
        <Animated.View entering={ZoomIn.duration(motion.slow)}>
          <GarmentTile garment={g} height={260} showLabel={false} iconSize={110} style={{ borderRadius: 28 }} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(motion.slow)} style={{ gap: 8 }}>
          <AppText style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 31 }}>{g.label}</AppText>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Sticker tone="highlight" label={`${g.wearCount} fois portée`} rotate={-2} />
            <Sticker tone="primary" label={lastWornText(g.lastWornAt)} rotate={2} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(motion.slow)} style={{ gap: 16 }}>
          <ChipRow label="Type">
            {CATEGORY_OPTIONS.map((c) => <Chip key={c.id} label={c.label} selected={g.category === c.id} onPress={() => set({ category: c.id })} />)}
          </ChipRow>
          <ChipRow label="Couleur">
            {COLOR_OPTIONS.map((c) => (
              <Chip key={c.name} label={c.name} selected={g.colorName === c.name}
                onPress={() => set({ colorName: c.name, colorHex: c.hex, label: `${g.subtype} ${c.name.toLowerCase()}` })} />
            ))}
          </ChipRow>
          <ChipRow label="Coupe">
            {FIT_OPTIONS.map((f) => <Chip key={f.id} label={f.label} selected={g.fit === f.id} onPress={() => set({ fit: f.id })} />)}
          </ChipRow>
          <ChipRow label="Saisons">
            {SEASON_OPTIONS.map((s) => (
              <Chip key={s.id} label={s.label} selected={g.seasons.includes(s.id)}
                onPress={() => set({ seasons: g.seasons.includes(s.id) ? g.seasons.filter((x) => x !== s.id) : [...g.seasons, s.id] })} />
            ))}
          </ChipRow>
          <ChipRow label="Style">
            {([1, 2, 3] as const).map((f) => (
              <Chip key={f} label={['Décontracté', 'Entre les deux', 'Habillé'][f - 1]} selected={g.formality === f} onPress={() => set({ formality: f })} />
            ))}
          </ChipRow>
          <ChipRow label="Chaleur">
            {([1, 2, 3] as const).map((w) => (
              <Chip key={w} label={['Léger', 'Mi-saison', 'Chaud'][w - 1]} selected={g.warmth === w} onPress={() => set({ warmth: w })} />
            ))}
          </ChipRow>
        </Animated.View>

        <Button label="Retirer de ma garde-robe" kind="ghost" onPress={remove} style={{ borderWidth: 1, borderColor: colors.chipBorder }} />
      </ScrollView>
    </Screen>
  );
}
