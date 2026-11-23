import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, {
  FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Button, Chip, IconButton, ProgressBar, Screen, Sticker } from '@/components/ui';
import { analyzeGarment, type GarmentGuess } from '@/lib/ai';
import { track } from '@/lib/analytics';
import { newId, useStore } from '@/state/AppStore';
import { useAuth } from '@/state/AuthStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';
import { CATEGORY_OPTIONS as CATEGORIES, COLOR_OPTIONS as COLORS, FIT_OPTIONS as FITS, PATTERN_OPTIONS as PATTERNS, SEASON_OPTIONS as SEASONS } from '@/data/garmentOptions';

const TARGET = 10; // nombre de pièces avant le premier look

function ScanLine() {
  const { colors } = useTheme();
  const y = useSharedValue(-120);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(120, { duration: 900 }), withTiming(-120, { duration: 900 })), -1);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, backgroundColor: colors.primary,
      shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 12 }, style]} />
  );
}

export default function AddGarmentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const { addGarment } = useStore();
  const { userId } = useAuth();

  const [photo, setPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [guess, setGuess] = useState<GarmentGuess | null>(null);
  const [added, setAdded] = useState(0);
  const [garmentId, setGarmentId] = useState(newId);

  const pickPhoto = async (fromCamera: boolean) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation nécessaire', 'Autorise l’accès dans les réglages du téléphone pour ajouter tes vêtements.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    setPhoto(uri);
    setGuess(null);
    setScanning(true);
    try {
      setGuess(await analyzeGarment(uri, { userId, garmentId }));
    } finally {
      setScanning(false);
    }
  };

  const save = () => {
    if (!guess || !photo) return;
    const { confidence: _c, isGarment: _g, cutoutUrl, label: aiLabel, ...fields } = guess;
    const label = aiLabel ?? `${guess.subtype} ${guess.colorName.toLowerCase()}`;
    addGarment({ id: garmentId, ...fields, label, imageUrl: cutoutUrl ?? photo, wearCount: 0 });
    setGarmentId(newId()); // la pièce suivante aura sa propre photo
    setAdded((n) => n + 1);
    track('garment_added', { category: guess.category, onboarding: inOnboarding });
    setPhoto(null);
    setGuess(null);
  };

  // Si on corrige le type ou la couleur, le nom proposé par l'IA ne colle plus : on le recompose.
  const set = (patch: Partial<GarmentGuess>) => setGuess((g) => (g ? { ...g, ...patch, ...('category' in patch || 'colorName' in patch ? { label: undefined } : {}) } : g));
  const inOnboarding = onboarding === '1';
  const remaining = Math.max(0, TARGET - added);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <IconButton icon={inOnboarding ? 'close' : 'chevronLeft'} label="Retour" onPress={() => (inOnboarding ? router.replace('/(tabs)') : router.back())} />
        <AppText style={{ fontFamily: fonts.display, fontSize: 18 }}>Nouvelle pièce</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}>
        {inOnboarding ? (
          <View style={{ backgroundColor: colors.inverse, borderRadius: 18, padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="smallStrong" color={colors.onInverse}>
                {remaining > 0 ? `Encore ${remaining} ${remaining > 1 ? 'pièces' : 'pièce'} avant ton premier look` : 'Ton premier look est prêt !'}
              </AppText>
              <AppText style={{ fontFamily: fonts.display, fontSize: 13 }} color={colors.onInverse}>{added}/{TARGET}</AppText>
            </View>
            <ProgressBar value={added / TARGET} color={colors.highlight} track={colors.onInverse + "33"} />
          </View>
        ) : null}

        <View style={{ height: 280, borderRadius: 28, backgroundColor: guess ? guess.colorHex + '55' : colors.surface, borderWidth: photo ? 0 : 2,
          borderStyle: 'dashed', borderColor: colors.chipBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {photo ? (
            <>
              <Animated.View entering={ZoomIn.springify()} style={{ width: 210, height: 210, borderRadius: 105, overflow: 'hidden', backgroundColor: colors.surface }}>
                <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Animated.View>
              {scanning ? <ScanLine /> : null}
              <View style={{ position: 'absolute', top: 14, left: 14 }}>
                <Sticker tone="highlight" icon="sparkle" label={scanning ? 'Analyse en cours…' : !guess ? '' : !guess.isGarment ? 'Pas de vêtement repéré' : guess.confidence > 0 ? 'Reconnu par l’IA' : userId ? 'À décrire' : 'Mode démo'} />
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 14, padding: 20 }}>
              <Icon name="camera" size={40} color={colors.textMuted} strokeWidth={1.4} />
              <AppText muted style={{ textAlign: 'center' }}>Pose le vêtement à plat ou sur un cintre, bien éclairé, sur un fond uni.</AppText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button label="Prendre une photo" icon="camera" onPress={() => pickPhoto(true)} style={{ height: 48, paddingHorizontal: 16 }} />
                <Button label="Galerie" kind="inverse" onPress={() => pickPhoto(false)} style={{ height: 48, paddingHorizontal: 16 }} />
              </View>
            </View>
          )}
        </View>

        {guess && !guess.isGarment ? (
          // L'IA ne voit pas de vêtement : on bloque l'ajout, sauf si la personne confirme.
          <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ gap: 12, padding: 18, borderRadius: 22, backgroundColor: colors.surface }}>
            <AppText variant="heading">On ne voit pas de vêtement</AppText>
            <AppText muted>Pose la pièce à plat ou sur un cintre, en entier, bien éclairée, sur un fond uni. Évite de la porter sur toi.</AppText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Reprendre" icon="camera" onPress={() => pickPhoto(true)} style={{ flex: 1, height: 48 }} />
              <Button label="Galerie" kind="inverse" onPress={() => pickPhoto(false)} style={{ flex: 1, height: 48 }} />
            </View>
            <PressableScale onPress={() => { set({ isGarment: true }); track('garment_ai_override'); }} style={{ alignSelf: 'center', paddingVertical: 8 }}>
              <AppText variant="smallStrong" color={colors.primary}>C’est bien un vêtement, je le décris moi-même</AppText>
            </PressableScale>
          </Animated.View>
        ) : guess ? (
          <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ gap: 16 }}>
            {guess.label ? <AppText variant="heading">{guess.label}</AppText> : null}
            <AppText variant="eyebrow">{guess.confidence > 0 ? 'Touche pour corriger' : userId ? 'L’IA n’a pas pu analyser la photo : décris la pièce' : 'Mode démo : l’IA ne regarde pas la photo, décris la pièce'}</AppText>
            <ChipRow label="Type">
              {CATEGORIES.map((c) => <Chip key={c.id} label={c.label} selected={guess.category === c.id} onPress={() => set({ category: c.id })} />)}
            </ChipRow>
            <ChipRow label="Couleur">
              {COLORS.map((c) => (
                <Chip key={c.name} label={c.name} selected={guess.colorName === c.name} onPress={() => set({ colorName: c.name, colorHex: c.hex })} />
              ))}
            </ChipRow>
            <ChipRow label="Coupe">
              {FITS.map((f) => <Chip key={f.id} label={f.label} selected={guess.fit === f.id} onPress={() => set({ fit: f.id })} />)}
            </ChipRow>
            <ChipRow label="Motif">
              {PATTERNS.map((p) => <Chip key={p} label={p} selected={(guess.pattern ?? 'Uni') === p} onPress={() => set({ pattern: p })} />)}
            </ChipRow>
            <ChipRow label="Saisons">
              {SEASONS.map((s) => (
                <Chip key={s.id} label={s.label} selected={guess.seasons.includes(s.id)}
                  onPress={() => set({ seasons: guess.seasons.includes(s.id) ? guess.seasons.filter((x) => x !== s.id) : [...guess.seasons, s.id] })} />
              ))}
            </ChipRow>
            <Button label={inOnboarding ? 'Valider et ajouter la suivante' : 'Ajouter à ma garde-robe'} onPress={save} />
          </Animated.View>
        ) : null}

        {inOnboarding && remaining === 0 ? (
          <Animated.View entering={ZoomIn.springify()}>
            <Button label="Voir mon premier look" kind="accent" icon="sparkle" onPress={() => router.replace('/(tabs)')} />
          </Animated.View>
        ) : null}
        {!inOnboarding && added > 0 && !photo ? (
          <Button label="Terminé" kind="inverse" onPress={() => router.back()} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
