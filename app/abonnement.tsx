import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Button } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

/**
 * Écran d'abonnement. Le paiement sera branché sur RevenueCat (étape 6 du plan) :
 * les prix affichés viendront alors des stores, pas de ce fichier.
 */
const PLANS = [
  { id: 'year', name: 'Annuel', sub: 'Soit 3,33 € par mois', price: '39,99 € / an', badge: '-52 %', after: 'Puis 39,99 € par an. Annulable à tout moment.' },
  { id: 'month', name: 'Mensuel', sub: 'Sans engagement', price: '6,99 € / mois', badge: '', after: 'Puis 6,99 € par mois. Annulable à tout moment.' },
] as const;

const PERKS = ['Des looks chaque matin selon la météo', 'Des tenues adaptées à ton humeur', 'Ta garde-robe illimitée', 'Le mot du styliste tous les jours'];

function PlanCard({ plan, selected, onPress }: { plan: (typeof PLANS)[number]; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const border = useAnimatedStyle(() => ({ borderColor: withTiming(selected ? colors.primary : colors.surfaceBorder, { duration: motion.base }) }), [selected, colors]);
  const radio = useAnimatedStyle(() => ({ borderWidth: withSpring(selected ? 7 : 2, motion.spring), borderColor: selected ? colors.primary : colors.track }), [selected, colors]);
  return (
    <PressableScale accessibilityRole="radio" accessibilityState={{ checked: selected }} haptic="select" pressedScale={0.97} onPress={onPress}>
      <Animated.View style={[{ height: 80, borderRadius: 20, borderWidth: 2, backgroundColor: colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, border]}>
        <View style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText style={{ fontFamily: fonts.displayBold, fontSize: 18 }}>{plan.name}</AppText>
            {plan.badge ? (
              <View style={{ backgroundColor: colors.highlight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <AppText variant="tiny" color={colors.onHighlight} style={{ fontFamily: fonts.bodyBold }}>{plan.badge}</AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="small" muted>{plan.sub}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppText variant="bodyStrong">{plan.price}</AppText>
          <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }, radio]} />
        </View>
      </Animated.View>
    </PressableScale>
  );
}

export default function PaywallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const current = PLANS.find((p) => p.id === plan)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: '#2B44C6', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 14, letterSpacing: 2 }} color="#FFFFFF">DRESSING AI · PREMIUM</AppText>
            <PressableScale accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => router.back()}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color="#FFFFFF" strokeWidth={2} />
            </PressableScale>
          </View>
          <Animated.View entering={FadeInDown.duration(motion.slow)}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36 }} color="#FFFFFF">Ton styliste perso, chaque matin.</AppText>
          </Animated.View>
          <View style={{ gap: 10 }}>
            {PERKS.map((p, k) => (
              <Animated.View key={p} entering={FadeInDown.delay(100 + k * 60).duration(motion.slow)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F6D867', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} color="#15151C" strokeWidth={2.8} />
                </View>
                <AppText color="#FFFFFF" style={{ fontFamily: fonts.bodyMedium }}>{p}</AppText>
              </Animated.View>
            ))}
          </View>
        </SafeAreaView>
        <Animated.View entering={ZoomIn.delay(250).springify()} style={{ position: 'absolute', right: 18, bottom: -16 }}>
          <View style={{ backgroundColor: '#FF5A3C', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, transform: [{ rotate: '-5deg' }] }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 14 }} color="#15151C">7 jours offerts</AppText>
          </View>
        </Animated.View>
      </View>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 34, gap: 10 }}>
          {PLANS.map((p) => <PlanCard key={p.id} plan={p} selected={plan === p.id} onPress={() => setPlan(p.id)} />)}
          <View style={{ flex: 1, minHeight: 16 }} />
          <Button label="Commencer mes 7 jours gratuits" onPress={() => Alert.alert('Bientôt', 'Le paiement sera activé avant le lancement sur les stores.')} />
          <AppText variant="small" muted style={{ textAlign: 'center', fontSize: 12 }}>{current.after}</AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <PressableScale onPress={() => {}} style={{ paddingVertical: 10 }}><AppText variant="smallStrong" color={colors.primary}>J’ai un code promo</AppText></PressableScale>
            <PressableScale onPress={() => {}} style={{ paddingVertical: 10 }}><AppText variant="smallStrong" color={colors.primary}>Restaurer mes achats</AppText></PressableScale>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
