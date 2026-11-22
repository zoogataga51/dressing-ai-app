import Svg, { Path } from 'react-native-svg';

/** Icônes au trait, dessinées à la main (pas d'emoji, pas de librairie lourde). */
const paths = {
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  hanger: 'M12 6a2 2 0 1 1 2 2c-1 0-2 .8-2 2l9 6.5c.8.6.4 1.5-.5 1.5h-17c-.9 0-1.3-.9-.5-1.5L12 10',
  calendar: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11.5 3.5 3.5 0 0 0 7 18z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  rain: 'M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 8.5 3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  top: 'M8.5 4L12 5.5 15.5 4 20 7l-1.8 3.6-2.2-1V20H8V9.6l-2.2 1L4 7z',
  bottom: 'M7 3h10l1.2 18h-4.4L12 10l-1.8 11H5.8z',
  dress: 'M9 3h6l-1 4 5 14H5l5-14z',
  shoes: 'M3 16.5c0-2.5.8-5 1.8-7l3.4 2c2.2 1.3 5 2 8 2 2.8 0 4.8 1.1 4.8 3v2H3z',
  outer: 'M8 3l4 3.5L16 3l4 3v15H4V6zM12 6.5V21',
  accessory: 'M4 15c0-4.4 3.6-8 8-8s8 3.6 8 8M2 15h20',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
