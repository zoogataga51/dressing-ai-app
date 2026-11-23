import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Button, IconButton, Screen } from '@/components/ui';
import { track } from '@/lib/analytics';
import { isValidEmail, useAuth } from '@/state/AuthStore';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

const CODE_LENGTH = 6;
const RESEND_AFTER = 60; // secondes

/** Les 6 cases du code. Un seul champ invisible derrière, pour le copier-coller et le remplissage auto. */
function CodeBoxes({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: boolean }) {
  const { colors } = useTheme();
  const input = useRef<TextInputInstance>(null);
  const shake = useSharedValue(0);
  useEffect(() => {
    if (error) shake.value = withSequence(...[-8, 8, -6, 6, 0].map((x) => withTiming(x, { duration: motion.fast / 2 })));
  }, [error, shake]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  return (
    <PressableScale haptic="select" pressedScale={0.99} accessibilityLabel="Code reçu par e-mail" onPress={() => input.current?.focus()}>
      <Animated.View style={[{ flexDirection: 'row', gap: 8 }, anim]}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const focused = i === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <View key={i} style={{ flex: 1, height: 62, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.surface, borderColor: error ? colors.danger : focused ? colors.primary : colors.surfaceBorder }}>
              <AppText style={{ fontFamily: fonts.display, fontSize: 26 }}>{value[i] ?? ''}</AppText>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={input}
        autoFocus
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        caretHidden
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </PressableScale>
  );
}

export default function ConnexionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const auth = useAuth();
  const store = useStore();
  const existing = mode === 'login';
  const linking = mode === 'link'; // compte sans e-mail qu'on sécurise

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // Une fois connecté et les données rechargées : look du jour si le profil existe, sinon questionnaire.
  useEffect(() => {
    if (linking || !auth.userId || store.syncedUserId !== auth.userId) return;
    track('auth_done', { existing: store.profile.onboarded });
    router.replace(store.profile.onboarded ? '/(tabs)' : '/onboarding/questionnaire');
  }, [auth.userId, store.syncedUserId, store.profile.onboarded, router]);

  const send = async () => {
    if (!isValidEmail(email)) { setError('Cette adresse e-mail ne semble pas valide.'); return; }
    setBusy(true);
    setError(null);
    const res = linking ? await auth.linkEmail(email) : await auth.sendCode(email);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    track('auth_code_sent');
    setCode('');
    setWait(RESEND_AFTER);
    setStep('code');
  };

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    const res = linking ? await auth.verifyLinkCode(email, value) : await auth.verifyCode(email, value);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    if (linking) {
      track('account_secured');
      Alert.alert('Compte sécurisé', 'Ta garde-robe est maintenant liée à ton e-mail : tu la retrouveras sur n’importe quel téléphone.', [{ text: 'Parfait', onPress: () => router.back() }]);
    }
    // Sinon : l'effet plus haut prend le relais dès que les données sont chargées.
  };

  const connected = !!auth.userId;

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton icon="chevronLeft" label="Retour" onPress={() => (step === 'code' ? (setStep('email'), setError(null)) : router.back())} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 22 }}>
          {step === 'email' ? (
            <Animated.View key="email" entering={FadeInDown.duration(motion.base)} style={{ gap: 18 }}>
              <View style={{ gap: 10 }}>
                <AppText variant="eyebrow" color={colors.primary}>{existing ? 'Content de te revoir' : linking ? 'Sécuriser mon compte' : 'Ton compte'}</AppText>
                <AppText style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.3 }}>
                  {existing ? 'Retrouve ta garde-robe.' : 'Ta garde-robe, à l’abri.'}
                </AppText>
                {linking ? <AppText muted style={{ fontSize: 16, lineHeight: 23 }}>Si tu changes de téléphone ou supprimes l’appli, ton e-mail te permettra de tout retrouver.</AppText> : null}
                <AppText muted style={{ fontSize: 16, lineHeight: 23 }}>
                  On t’envoie un code par e-mail. Pas de mot de passe à retenir.
                </AppText>
              </View>
              <TextInput
                autoFocus
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="ton@email.fr"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={send}
                style={{ height: 58, borderRadius: 18, borderWidth: 2, borderColor: error ? colors.danger : colors.primary, backgroundColor: colors.surface,
                  paddingHorizontal: 16, fontFamily: fonts.bodySemi, fontSize: 18, color: colors.text }}
              />
            </Animated.View>
          ) : (
            <Animated.View key="code" entering={FadeInRight.duration(motion.base)} style={{ gap: 18 }}>
              <View style={{ gap: 10 }}>
                <AppText variant="eyebrow" color={colors.primary}>Vérifie tes e-mails</AppText>
                <AppText style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.3 }}>Recopie ton code.</AppText>
                <AppText muted style={{ fontSize: 16, lineHeight: 23 }}>
                  Envoyé à <AppText variant="bodyStrong">{email.trim().toLowerCase()}</AppText>. Pense à regarder dans les indésirables.
                  Tu peux aussi toucher le lien de l’e-mail depuis ce téléphone.
                </AppText>
              </View>
              <CodeBoxes value={code} error={!!error} onChange={(v) => { setCode(v); setError(null); if (v.length === CODE_LENGTH) verify(v); }} />
              <PressableScale disabled={wait > 0 || busy} onPress={send} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
                <AppText variant="bodyStrong" color={wait > 0 ? colors.textSubtle : colors.primary}>
                  {wait > 0 ? `Renvoyer un code dans ${wait} s` : 'Renvoyer un code'}
                </AppText>
              </PressableScale>
            </Animated.View>
          )}

          {error ? (
            <Animated.View entering={FadeInDown.duration(motion.fast)}>
              <AppText variant="smallStrong" color={colors.danger}>{error}</AppText>
            </Animated.View>
          ) : null}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          {step === 'email' ? (
            <Button label="Recevoir mon code" loading={busy} disabled={!email.trim()} onPress={send} />
          ) : (
            <Button label={connected && !linking ? 'Chargement de ton compte…' : 'Valider'} loading={busy || (connected && !linking)}
              disabled={code.length !== CODE_LENGTH} onPress={() => verify()} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
