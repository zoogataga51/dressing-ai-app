import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { AppText } from './AppText';

/** Rangée de pastilles qui défile horizontalement, avec un titre. */
export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="eyebrow">{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        {children}
      </ScrollView>
    </View>
  );
}
