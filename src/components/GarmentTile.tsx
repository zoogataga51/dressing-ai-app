import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { DEMO_GARMENT_IMAGES } from '@/data/demoImages';
import { onColor } from '@/lib/color';
import { useTheme } from '@/theme/ThemeProvider';
import type { Category, Garment } from '@/types';

const ICONS: Record<Category, IconName> = {
  top: 'top', bottom: 'bottom', dress: 'dress', outer: 'outer', shoes: 'shoes', accessory: 'accessory',
};

/**
 * Vignette d'un vêtement :
 *  - photo détourée (fond transparent) : posée sur la couleur du vêtement ;
 *  - photo normale (ou photo de démo) : remplit toute la vignette ;
 *  - sans photo : icône sur la couleur du vêtement.
 */
export function GarmentTile({ garment, height = 118, showLabel = true, iconSize = 58, style }: {
  garment: Garment; height?: number; showLabel?: boolean; iconSize?: number; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ height, borderRadius: 18, backgroundColor: garment.colorHex, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {garment.imageUrl && garment.cutoutPath
        ? <Image source={{ uri: garment.imageUrl }} style={{ width: '86%', height: '86%' }} contentFit="contain" transition={250} />
        : garment.imageUrl || DEMO_GARMENT_IMAGES[garment.id]
          ? <Image source={garment.imageUrl ? { uri: garment.imageUrl } : DEMO_GARMENT_IMAGES[garment.id]} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} />
          : <Icon name={ICONS[garment.category]} size={iconSize} color={onColor(garment.colorHex)} strokeWidth={1.3} />}
      {showLabel ? (
        <View style={{ position: 'absolute', left: 8, bottom: 8, right: 8, flexDirection: 'row' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '100%' }}>
            <AppText variant="tiny" numberOfLines={1}>{garment.label}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
