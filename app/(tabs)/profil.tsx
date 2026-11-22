import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Sheet } from '@/components/Sheet';
import { Button, Card, Chip, Row, Screen } from '@/components/ui';
import { scheduleMorningNotification } from '@/lib/notifications';
import { track } from '@/lib/analytics';
import { STYLE_OPTIONS_BY_ID } from '@/data/questionnaire';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion, space } from '@/theme/tokens';

const TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

function Toggle({ on }: { on: boolean }) {
  const { colors } = useTheme();
  const track = useAnimatedStyle(() => ({ backgroundColor: withTiming(on ? colors.primary : colors.track, { duration: motion.base }) }), [on, colors]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(on ? 20 : 0, motion.spring) }] }), [on]);
  return (
    <Animated.View style={[{ width: 48, height: 28, borderRadius: 14, padding: 3 }, track]}>
      <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }, knob]} />
    </Animated.View>
  );
}

function Section({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(motion.slow)} style={{ gap: 8 }}>
      <AppText variant="eyebrow">{title}</AppText>
      <Card>{children}</Card>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { colors, isDark, setMode } = useTheme();
  const router = useRouter();
  const { profile, resetAll, updateProfile } = useStore();
  const [sheet, setSheet] = useState<'city' | 'time' | null>(null);
  const [cityDraft, setCityDraft] = useState(profile.city);

  const styles = (profile.answers['styles'] ?? []).map((id) => STYLE_OPTIONS_BY_ID[id]?.label).filter(Boolean) as string[];
  const trialDaysLeft = profile.trialStartedAt
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.trialStartedAt).getTime()) / 86_400_000))
    : 7;
  const initial = (profile.firstName || 'Moi').charAt(0).toUpperCase();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 18 }}>
        <AppText variant="hero">Profil</AppText>

        <Animated.View entering={FadeInDown.duration(motion.slow)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26 }} color={colors.onPrimary}>{initial}</AppText>
          </View>
          <View style={{ gap: 4 }}>
            <AppText variant="heading" style={{ fontSize: 20 }}>{profile.firstName || 'Mon compte'}</AppText>
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.highlight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <AppText variant="tiny" color={colors.onHighlight} style={{ fontFamily: 'Inter_700Bold' }}>
                Essai gratuit · {trialDaysLeft} {trialDaysLeft > 1 ? 'jours restants' : 'jour restant'}
              </AppText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(motion.slow)}>
          <PressableScale pressedScale={0.98} onPress={() => router.push('/onboarding/questionnaire')}
            style={{ backgroundColor: colors.inverse, borderRadius: 22, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="eyebrow" color={colors.onInverse} style={{ opacity: 0.75 }}>Mon profil de style</AppText>
              <AppText variant="smallStrong" color={colors.highlight}>Refaire le questionnaire</AppText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(styles.length ? styles : ['À compléter']).map((s, i) => (
                <View key={s} style={{ backgroundColor: i === 0 ? colors.accent : colors.background, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
                  <AppText variant="smallStrong" color={i === 0 ? colors.onAccent : colors.text}>{s}</AppText>
                </View>
              ))}
            </View>
          </PressableScale>
        </Animated.View>

        <Section title="Chaque matin" delay={120}>
          <Row label="Ville pour la météo" value={profile.city} onPress={() => { setCityDraft(profile.city); setSheet('city'); }} />
          <Row label="Notification du look" value={profile.notificationTime.replace(':', ' h ')} onPress={() => setSheet('time')} />
          <Row label="Mode sombre" last right={<Toggle on={isDark} />} onPress={() => setMode(isDark ? 'light' : 'dark')} />
        </Section>

        <Section title="Abonnement" delay={180}>
          <Row label="Passer à Premium" value="Voir les offres" onPress={() => router.push('/abonnement')} />
          <Row label="J’ai un code promo" last onPress={() => router.push('/abonnement')} />
        </Section>

        <Section title="Compte et données" delay={240}>
          <Row label="Exporter mes données" onPress={() => Alert.alert('Bientôt', 'L’export de tes données arrive avec la connexion au compte.')} />
          <Row label="Se déconnecter" onPress={() => {}} />
          <Row label="Supprimer mon compte" danger last onPress={() =>
            Alert.alert('Supprimer ton compte ?', 'Ta garde-robe, tes photos et ton historique seront définitivement effacés.', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: async () => { await resetAll(); router.replace('/onboarding'); } },
            ])} />
        </Section>

        <AppText variant="tiny" muted style={{ textAlign: 'center', marginTop: space.sm }}>Dressing AI · version 0.1 (bêta)</AppText>
      </ScrollView>

      <Sheet visible={sheet === 'city'} title="Ta ville" onClose={() => setSheet(null)}>
        <TextInput autoFocus value={cityDraft} onChangeText={setCityDraft} placeholder="Ex. : Lyon" placeholderTextColor={colors.textSubtle}
          style={{ height: 56, borderRadius: 18, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface, paddingHorizontal: 16,
            fontFamily: fonts.displayBold, fontSize: 18, color: colors.text }} />
        <Button label="Enregistrer" disabled={!cityDraft.trim()} onPress={() => { updateProfile({ city: cityDraft.trim() }); setSheet(null); }} />
      </Sheet>

      <Sheet visible={sheet === 'time'} title="Heure de ton look" onClose={() => setSheet(null)}>
        <AppText muted>Tu recevras tes looks du jour chaque matin à cette heure.</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIMES.map((t) => (
            <Chip key={t} label={t.replace(':', ' h ')} selected={profile.notificationTime === t} onPress={async () => {
              updateProfile({ notificationTime: t });
              track('notification_time_set', { time: t });
              const ok = await scheduleMorningNotification(t, profile.firstName);
              if (!ok) Alert.alert('Notifications désactivées', 'Active-les dans les réglages du téléphone pour recevoir ton look du matin.');
              setSheet(null);
            }} />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
