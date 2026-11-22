import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { Button, Screen, Sticker } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

/**
 * Écran d'accueil. La création de compte (e-mail, Apple, Google) se branchera ici
 * avec Supabase Auth ; en attendant, on passe directement au questionnaire.
 */
export default function Welcome() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 16, justifyContent: 'space-between' }}>
        <View style={{ paddingTop: 40, gap: 18 }}>
          <Animated.View entering={FadeInDown.duration(motion.slow)}>
            <AppText variant="eyebrow" color={colors.primary} style={{ fontFamily: 'Syne_700Bold', letterSpacing: 2 }}>Dressing AI</AppText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(motion.slow)}>
            <AppText style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 46, lineHeight: 48, letterSpacing: -0.8 }}>
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
          <Button label="Créer mon profil de style" onPress={() => router.push('/onboarding/questionnaire')} />
          <AppText variant="small" muted style={{ textAlign: 'center' }}>Environ 3 minutes · 7 jours d’essai gratuit</AppText>
        </Animated.View>
      </View>
    </Screen>
  );
}
