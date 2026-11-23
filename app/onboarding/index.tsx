import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Button, Screen, Sticker } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useAuth } from '@/state/AuthStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

/**
 * Écran d'accueil : démarrage sans e-mail (compte anonyme), connexion par e-mail (Apple et Google viendront avec les comptes
 * développeur payants), connexion à un compte existant, ou découverte en mode démo.
 */
export default function Welcome() {
  const { colors } = useTheme();
  const router = useRouter();
  const { setDemo, startAnonymous } = useAuth();
  const [busy, setBusy] = useState(false);
  // Inscription en un geste : compte créé sans e-mail, l'e-mail se demande plus tard (Profil > Sécuriser mon compte).
  const start = async () => {
    setBusy(true);
    const res = await startAnonymous();
    setBusy(false);
    if (!res.ok) { Alert.alert('Oups', res.message); return; }
    track('auth_done', { anonymous: true });
    router.replace('/onboarding/questionnaire');
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 16, justifyContent: 'space-between' }}>
        <View style={{ paddingTop: 40, gap: 18 }}>
          <Animated.View entering={FadeInDown.duration(motion.slow)}>
            <AppText variant="eyebrow" color={colors.primary} style={{ fontFamily: fonts.bodyBold, letterSpacing: 2 }}>Dressing AI</AppText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(motion.slow)}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 50, letterSpacing: -0.5 }}>
              Ton look du jour, pensé avec tes vêtements.
            </AppText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).duration(motion.slow)}>
            <AppText muted style={{ fontSize: 16, lineHeight: 23 }}>
              Chaque matin, 3 tenues composées avec ta garde-robe, la météo et ton humeur. Fini le « je n’ai rien à me mettre ».
            </AppText>
          </Animated.View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Animated.View entering={ZoomIn.delay(350).springify()}><Sticker label="3 looks / jour" rotate={-4} /></Animated.View>
            <Animated.View entering={ZoomIn.delay(450).springify()}><Sticker label="Météo incluse" tone="highlight" icon="sun" rotate={3} /></Animated.View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(motion.slow)} style={{ gap: 10 }}>
          <Button label="Créer mon profil de style" loading={busy} onPress={start} />
          <AppText variant="small" muted style={{ textAlign: 'center' }}>Environ 3 minutes · 7 jours d’essai gratuit</AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 6 }}>
            <PressableScale onPress={() => router.push('/onboarding/connexion?mode=login')} style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
              <AppText variant="bodyStrong" color={colors.primary}>J’ai déjà un compte</AppText>
            </PressableScale>
            <AppText muted style={{ paddingVertical: 8 }}>·</AppText>
            <PressableScale onPress={() => { setDemo(true); track('demo_started'); router.replace('/'); }} style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
              <AppText variant="bodyStrong" muted>Mode démo</AppText>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}
