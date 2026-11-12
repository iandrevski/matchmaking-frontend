/**
 * Sportify дизајн систем: бои, радиуси, сенки, размаци.
 * Бојата се менува САМО тука.
 */

import '@/global.css';

import { Platform } from 'react-native';

// бренд бои (исти во светол и темен режим)
export const Brand = {
  primary: '#1E5B3F', // темно зелена: главни копчиња, избрано
  primaryPressed: '#174A33',
  forest: '#0F3526', // најтемна зелена: hero блокови
  accent: '#D3F36B', // лајм: само за главната акција врз темно
  onAccent: '#10261B',
  onPrimary: '#FFFFFF',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  onDarkFaint: 'rgba(255,255,255,0.14)',
  danger: '#D64545',
  success: '#2E8B57',
  warning: '#E08A2E',
  star: '#F2A93B',
} as const;

export const Colors = {
  light: {
    text: '#11201A',
    background: '#F4F7F5', // бела со зелена нијанса
    backgroundElement: '#FFFFFF', // картички
    backgroundSelected: '#E2EDE6',
    textSecondary: '#5D6E65',
    tint: '#1E5B3F', // акцентен текст и линкови
    tintSoft: '#E4F0E9', // нежна зелена позадина
    border: '#E1E9E4',
  },
  dark: {
    text: '#EEF5F1',
    background: '#0B1510',
    backgroundElement: '#14231B',
    backgroundSelected: '#1E3428',
    textSecondary: '#9CB2A6',
    tint: '#7ACFA3', // посветла зелена за да се чита на темно
    tintSoft: 'rgba(122,207,163,0.14)',
    border: '#22382C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22, // картички
  xl: 28, // hero блокови, bottom sheet
  pill: 999,
} as const;

// мека сенка за картички (во темен режим речиси не се гледа, и така треба)
export const CardShadow = {
  boxShadow: '0px 6px 20px rgba(16, 38, 27, 0.07)',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const TopTabInset = Platform.select({ web: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Plus Jakarta Sans: на телефон тежината се бира со посебно име на фонт, не со fontWeight
export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export function fontForWeight(weight?: string | number) {
  const w = weight === 'bold' ? 700 : weight === undefined || weight === 'normal' ? 500 : Number(weight);
  if (w >= 800) return FontFamily.extrabold;
  if (w >= 700) return FontFamily.bold;
  if (w >= 600) return FontFamily.semibold;
  if (w >= 500) return FontFamily.medium;
  return FontFamily.regular;
}
