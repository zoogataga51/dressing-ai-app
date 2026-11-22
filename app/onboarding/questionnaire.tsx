import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Button, IconButton, Screen } from '@/components/ui';
import { QUESTIONS, type Option, type Question } from '@/data/questionnaire';
import { useStore } from '@/state/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, motion } from '@/theme/tokens';

function OptionCard({ option, selected, onPress }: { option: Option; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const anim = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? colors.primary : colors.surfaceBorder, { duration: motion.base }),
    backgroundColor: withTiming(selected ? colors.primarySoft : colors.surface, { duration: motion.base }),
  }), [selected, colors]);
  const check = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(selected ? 1 : 0, motion.spring) }] }), [selected]);
  return (
    <PressableScale accessibilityRole="checkbox" accessibilityState={{ checked: selected }} haptic="select" onPress={onPress} pressedScale={0.97}>
      <Animated.View style={[{ minHeight: 58, borderRadius: 18, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, anim]}>
        {option.swatch ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: option.swatch, borderWidth: 1, borderColor: colors.chipBorder }} /> : null}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={{ fontFamily: fonts.displayBold, fontSize: 16 }}>{option.label}</AppText>
          {option.hint ? <AppText variant="small" muted>{option.hint}</AppText> : null}
        </View>
        <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, check]}>
          <Icon name="check" size={12} color={colors.onPrimary} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

export default function QuestionnaireScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, setAnswers, updateProfile } = useStore();
  const [step, setStep] = useState(0);
  const [answers, setLocal] = useState<Record<string, string[]>>(profile.answers);
  const [text, setText] = useState<Record<string, string>>({ firstName: profile.firstName, city: profile.city });

  const q: Question = QUESTIONS[step];
  const current = answers[q.id] ?? [];
  const isLast = step === QUESTIONS.length - 1;
  const canContinue = q.optional || (q.kind === 'text' ? (text[q.id] ?? '').trim().length > 0 : current.length > 0);

  const toggle = (id: string) => {
    let next: string[];
    if (q.kind === 'single') next = [id];
    else if (current.includes(id)) next = current.filter((x) => x !== id);
    else if (id === q.exclusiveOptionId) next = [id];
    else {
      next = [...current.filter((x) => x !== q.exclusiveOptionId), id];
      if (q.max && next.length > q.max) next = next.slice(next.length - q.max);
    }
    setLocal((a) => ({ ...a, [q.id]: next }));
    if (q.kind === 'single') setTimeout(() => goNext({ ...answers, [q.id]: next }), 220); // avance tout seul
  };

  const goNext = (latest = answers) => {
    if (isLast) {
      setAnswers(latest);
      updateProfile({ firstName: (text.firstName ?? '').trim(), city: (text.city ?? '').trim() || 'Paris' });
      router.push('/onboarding/duels');
    } else setStep((s) => Math.min(QUESTIONS.length - 1, s + 1));
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton icon="chevronLeft" label="Question précédente" onPress={() => (step === 0 ? router.back() : setStep(step - 1))} />
          <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
            {QUESTIONS.map((x, i) => (
              <View key={x.id} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.primary : colors.chipBorder }} />
            ))}
          </View>
          <AppText style={{ fontFamily: fonts.display, fontSize: 14 }}>{String(step + 1).padStart(2, '0')}/{QUESTIONS.length}</AppText>
        </View>

        <Animated.View key={q.id} entering={FadeInRight.duration(motion.base)} exiting={FadeOutLeft.duration(motion.fast)} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18 }}>
            <View style={{ gap: 10 }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, transform: [{ rotate: '-2deg' }] }}>
                <AppText variant="smallStrong" color={colors.onAccent}>{q.section}</AppText>
              </View>
              <AppText style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 33, letterSpacing: -0.3 }}>{q.title}</AppText>
              {q.subtitle ? <AppText muted>{q.subtitle}</AppText> : null}
            </View>

            {q.kind === 'text' ? (
              <TextInput
                autoFocus
                value={text[q.id] ?? ''}
                onChangeText={(v) => setText((t) => ({ ...t, [q.id]: v }))}
                placeholder={q.placeholder}
                placeholderTextColor={colors.textSubtle}
                returnKeyType="next"
                onSubmitEditing={() => canContinue && goNext()}
                style={{ height: 58, borderRadius: 18, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface, paddingHorizontal: 16,
                  fontFamily: fonts.displayBold, fontSize: 20, color: colors.text }}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {q.options?.map((o) => <OptionCard key={o.id} option={o} selected={current.includes(o.id)} onPress={() => toggle(o.id)} />)}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {q.kind !== 'single' || q.optional ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}>
            <Button label={isLast ? 'Passer aux duels de looks' : q.optional && !current.length ? 'Passer' : 'Continuer'}
              disabled={!canContinue} onPress={() => goNext()} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
