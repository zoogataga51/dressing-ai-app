import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { IconButton, Screen } from '@/components/ui';
import { LEGAL_DOCS } from '@/data/legal';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

/** Conditions d'utilisation et politique de confidentialité (textes dans src/data/legal.ts). */
export default function LegalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = LEGAL_DOCS[doc === 'cgu' ? 'cgu' : 'confidentialite'];
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <IconButton icon="chevronLeft" label="Retour" onPress={() => router.back()} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}>
        <Animated.View entering={FadeInDown.duration(motion.base)} style={{ gap: 6 }}>
          <AppText variant="hero">{d.title}</AppText>
          <AppText variant="small" muted>Mise à jour : {d.updated}</AppText>
        </Animated.View>
        {d.sections.map((s) => (
          <View key={s.title} style={{ gap: 8 }}>
            <AppText variant="heading" color={colors.primary}>{s.title}</AppText>
            {s.body.map((p, i) => (
              <AppText key={i} style={{ lineHeight: 22 }}>{p.startsWith('- ') ? `•  ${p.slice(2)}` : p}</AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
