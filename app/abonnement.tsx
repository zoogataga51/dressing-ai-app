import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Button } from '@/components/ui';
import { getAccess } from '@/lib/access';
import { track } from '@/lib/analytics';
import { buy, getPlans, PURCHASES_ENABLED, redeemCode, restore, type Plan } from '@/lib/purchases';
import { useStore } from '@/state/AppStore';
import { useAuth } from '@/state/AuthStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

/**
 * Écran d'abonnement. Paiement via RevenueCat (src/lib/purchases.ts) : les prix viennent des stores
 * quand les achats sont actifs ; sinon, prix de référence.
 */
const PLANS = [
  { id: 'year', name: 'Annuel', sub: 'Soit 3,33 € par mois', unit: '/ an', badge: '-52 %' },
  { id: 'month', name: 'Mensuel', sub: 'Sans engagement', unit: '/ mois', badge: '' },
] as const;

const MANAGE_URL = Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';
const frDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const PERKS = ['Des looks chaque matin selon la météo', 'Des tenues adaptées à ton humeur', 'Ta garde-robe illimitée', 'Le mot du styliste tous les jours'];

function PlanCard({ plan, price, selected, onPress }: { plan: (typeof PLANS)[number]; price: string; selected: boolean; onPress: () => void }) {
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
          <AppText variant="bodyStrong">{price} {plan.unit}</AppText>
          <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface }, radio]} />
        </View>
      </Animated.View>
    </PressableScale>
  );
}

export default function PaywallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useStore();
  const { userId } = useAuth();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const [prices, setPrices] = useState<Plan[]>([]);
  const [busy, setBusy] = useState(false);
  const access = getAccess(profile);
  const price = (id: 'year' | 'month') => prices.find((p) => p.id === id)?.price ?? (id === 'year' ? '39,99 €' : '6,99 €');
  useEffect(() => { track('paywall_view', { state: access.state }); getPlans().then(setPrices); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unlocked = (until: string | null) => {
    if (until) updateProfile({ premiumUntil: until });
    Alert.alert('Bienvenue dans Premium !', 'Tes looks t’attendent chaque matin.', [{ text: 'Super', onPress: () => router.back() }]);
  };

  const subscribe = async () => {
    if (!userId) {
      Alert.alert('Crée ton compte', 'Ton abonnement doit être rattaché à un compte pour suivre ta garde-robe.', [
        { text: 'Plus tard', style: 'cancel' }, { text: 'Créer mon compte', onPress: () => router.replace('/onboarding/connexion') },
      ]);
      return;
    }
    const chosen = prices.find((p) => p.id === plan);
    track('paywall_subscribe_tap', { plan });
    setBusy(true);
    const res = chosen ? await buy(chosen) : { ok: false as const, message: 'Le paiement sera activé à la sortie sur l’App Store et Google Play.' };
    setBusy(false);
    if (res.ok) { track('subscribed', { plan }); unlocked(res.premiumUntil); } else if (!res.cancelled) Alert.alert('Abonnement', res.message);
  };

  const onRestore = async () => {
    setBusy(true);
    const res = await restore();
    setBusy(false);
    if (res.ok) unlocked(res.premiumUntil); else Alert.alert('Restaurer mes achats', res.message);
  };

  const onCode = async () => {
    if (!(await redeemCode())) Alert.alert('Code promo', 'Les codes promo arrivent avec la sortie sur les stores. Garde-le précieusement !');
  };

  const cta = access.state === 'premium' ? 'Gérer mon abonnement' : access.state === 'expired' ? 'Continuer avec Premium' : 'Passer à Premium';
  const note = access.state === 'premium'
    ? `Tu es Premium${profile.premiumUntil && !profile.premiumUntil.startsWith('2999') ? ` jusqu’au ${frDate(new Date(profile.premiumUntil))}` : ''}. Merci !`
    : `${plan === 'year' ? `${price('year')} par an` : `${price('month')} par mois`}, renouvelé automatiquement. Annulable à tout moment dans les réglages de ton compte ${Platform.OS === 'ios' ? 'Apple' : 'Google'}, au moins 24 h avant le renouvellement.`
      + (access.state === 'trial' && access.trialEndsAt ? ` Ton essai gratuit continue jusqu’au ${frDate(access.trialEndsAt)}.` : '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.brand, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 14, letterSpacing: 2 }} color={colors.onBrand}>DRESSING AI · PREMIUM</AppText>
            <PressableScale accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => router.back()}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.onBrand + '29', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color={colors.onBrand} strokeWidth={2} />
            </PressableScale>
          </View>
          <Animated.View entering={FadeInDown.duration(motion.slow)}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36 }} color={colors.onBrand}>Ton styliste perso, chaque matin.</AppText>
          </Animated.View>
          <View style={{ gap: 10 }}>
            {PERKS.map((p, k) => (
              <Animated.View key={p} entering={FadeInDown.delay(100 + k * 60).duration(motion.slow)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} color={colors.onHighlight} strokeWidth={2.8} />
                </View>
                <AppText color={colors.onBrand} style={{ fontFamily: fonts.bodyMedium }}>{p}</AppText>
              </Animated.View>
            ))}
          </View>
        </SafeAreaView>
        <Animated.View entering={ZoomIn.delay(250).springify()} style={{ position: 'absolute', right: 18, bottom: -16 }}>
          <View style={{ backgroundColor: colors.accent, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, transform: [{ rotate: '-5deg' }] }}>
            <AppText style={{ fontFamily: fonts.bodyBold, fontSize: 14 }} color={colors.onAccent}>
              {access.state === 'premium' ? 'Premium' : access.state === 'trial' ? `${access.daysLeft} ${access.daysLeft > 1 ? 'jours' : 'jour'} d’essai` : 'Essai terminé'}
            </AppText>
          </View>
        </Animated.View>
      </View>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 34, gap: 10 }}>
          {access.state === 'premium' ? null : PLANS.map((p) => <PlanCard key={p.id} plan={p} price={price(p.id)} selected={plan === p.id} onPress={() => setPlan(p.id)} />)}
          <View style={{ flex: 1, minHeight: 16 }} />
          <Button label={cta} loading={busy} onPress={access.state === 'premium' ? () => Linking.openURL(MANAGE_URL) : subscribe} />
          <AppText variant="small" muted style={{ textAlign: 'center', fontSize: 12 }}>{note}</AppText>
          {!PURCHASES_ENABLED ? <AppText variant="small" muted style={{ textAlign: 'center', fontSize: 12 }}>Version bêta : le paiement sera activé à la sortie sur les stores.</AppText> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <PressableScale onPress={onCode} style={{ paddingVertical: 10 }}><AppText variant="smallStrong" color={colors.primary}>J’ai un code promo</AppText></PressableScale>
            <PressableScale onPress={onRestore} style={{ paddingVertical: 10 }}><AppText variant="smallStrong" color={colors.primary}>Restaurer mes achats</AppText></PressableScale>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
            <PressableScale onPress={() => router.push('/legal/cgu')} style={{ paddingVertical: 6 }}><AppText variant="tiny" muted>Conditions d’utilisation</AppText></PressableScale>
            <PressableScale onPress={() => router.push('/legal/confidentialite')} style={{ paddingVertical: 6 }}><AppText variant="tiny" muted>Confidentialité</AppText></PressableScale>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
