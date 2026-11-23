import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Button, Screen, Sticker } from '@/components/ui';
import { duelsFor, stylesFromDuels, type DuelLook } from '@/data/duels';
import { STYLE_OPTIONS_BY_ID } from '@/data/questionnaire';
import { mix, readableOn } from '@/lib/color';
import { track } from '@/lib/analytics';
import { scheduleMorningNotification } from '@/lib/notifications';
import { useStore, type DuelChoice } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

function LookCard({ look, onPress, side }: { look: DuelLook; onPress: () => void; side: 'a' | 'b' }) {
  const { colors } = useTheme();
  const tint = mix(colors.background, look.pieces[0]?.hex ?? colors.background, 0.22);
  const Enter = side === 'a' ? FadeInLeft : FadeInRight;
  return (
    <Animated.View entering={Enter.duration(motion.slow).springify()} style={{ flex: 1 }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Je préfère : ${look.title}`} haptic="medium" pressedScale={0.94} onPress={onPress}
        style={{ flex: 1, borderRadius: 24, backgroundColor: tint, padding: 12, gap: 10 }}>
        {look.imageUrl ? (
          <Image source={{ uri: look.imageUrl }} style={{ flex: 1, borderRadius: 16 }} contentFit="cover" transition={250} />
        ) : (
          <View style={{ flex: 1, gap: 6 }}>
            {look.pieces.map((p) => (
              <View key={p.label} style={{ flex: 1, borderRadius: 14, backgroundColor: p.hex, justifyContent: 'flex-end', padding: 8 }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <AppText variant="tiny" numberOfLines={1}>{p.label}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}
        <AppText style={{ fontFamily: fonts.displayBold, fontSize: 16 }} color={readableOn(tint)} numberOfLines={1}>{look.title}</AppText>
      </PressableScale>
    </Animated.View>
  );
}

export default function DuelsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, setDuels, setAnswers, completeOnboarding } = useStore();
  const duels = useMemo(() => duelsFor(profile.answers['wardrobe']?.[0]), [profile.answers]);
  const [i, setI] = useState(0);
  const [choices, setChoices] = useState<DuelChoice[]>([]);
  const done = i >= duels.length;
  const styles = useMemo(() => (done ? stylesFromDuels(duels, choices) : []), [done, duels, choices]);

  const pick = (picked: DuelChoice['picked']) => {
    setChoices((c) => [...c, { duelId: duels[i].id, picked }]);
    track('onboarding_duel', { index: i + 1, picked });
    setI((x) => x + 1);
  };

  const finish = () => {
    const redo = profile.onboarded; // questionnaire refait depuis le Profil
    setDuels(choices);
    setAnswers({ ...profile.answers, styles });
    completeOnboarding();
    track('onboarding_done', { styles });
    scheduleMorningNotification(profile.notificationTime, profile.firstName).catch(() => {});
    if (redo) router.dismissTo('/(tabs)/profil'); // retour au Profil, sans laisser le questionnaire derrière
    else router.replace('/ajout?onboarding=1');
  };

  if (done) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
          <View style={{ gap: 16, paddingTop: 40 }}>
            <AppText variant="eyebrow">Ton profil de style</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 39 }}>On a cerné ton style.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {(styles.length ? styles : ['minimal']).map((s, k) => (
                <Animated.View key={s} entering={ZoomIn.delay(150 + k * 120).springify()}>
                  <Sticker label={STYLE_OPTIONS_BY_ID[s]?.label ?? s} tone={k === 0 ? 'accent' : k === 1 ? 'highlight' : 'primary'} rotate={k % 2 ? 3 : -3} />
                </Animated.View>
              ))}
            </View>
            <Animated.View entering={FadeInDown.delay(500)}>
              <AppText muted style={{ fontSize: 16, lineHeight: 23 }}>
                Maintenant, photographie 10 à 15 de tes pièces préférées. Ton premier look arrive juste après.
              </AppText>
            </Animated.View>
          </View>
          <Button label="Ajouter mes vêtements" icon="camera" onPress={finish} />
        </View>
      </Screen>
    );
  }

  const duel = duels[i];
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 12, gap: 16 }}>
        <View style={{ paddingTop: 8, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {duels.map((d, k) => <View key={d.id} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k < i ? colors.primary : colors.chipBorder }} />)}
          </View>
          <AppText variant="eyebrow">Duel {i + 1} sur {duels.length}</AppText>
          <AppText style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 33 }}>Lequel tu porterais ?</AppText>
        </View>

        <View key={duel.id} style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
          <LookCard look={duel.a} side="a" onPress={() => pick('a')} />
          <LookCard look={duel.b} side="b" onPress={() => pick('b')} />
        </View>

        <PressableScale accessibilityRole="button" onPress={() => pick('none')} style={{ alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <AppText variant="bodyStrong" color={colors.primary}>Aucun des deux</AppText>
        </PressableScale>
      </View>
    </Screen>
  );
}
