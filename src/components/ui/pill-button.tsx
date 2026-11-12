import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { IconName } from '@/components/ui/icon';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/utils/haptics';

export type PillVariant = 'primary' | 'accent' | 'soft' | 'outline' | 'outlineLight' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: PillVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// заоблено копче во облик на пилула; една компонента за сите копчиња
export function PillButton({ label, onPress, variant = 'primary', size = 'md', icon, loading, disabled, style }: Props) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const look: Record<PillVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: Brand.primary, fg: Brand.onPrimary },
    accent: { bg: Brand.accent, fg: Brand.onAccent },
    soft: { bg: theme.tintSoft, fg: theme.tint },
    outline: { bg: 'transparent', fg: theme.text, border: theme.border },
    outlineLight: { bg: 'transparent', fg: Brand.onDark, border: 'rgba(255,255,255,0.45)' },
    danger: { bg: 'rgba(214,69,69,0.12)', fg: Brand.danger },
  };
  const { bg, fg, border } = look[variant];

  function press() {
    haptic.tap();
    onPress();
  }

  return (
    <Pressable
      onPress={press}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bg },
        border && { borderColor: border, borderWidth: 1.5 },
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Feather name={icon} size={size === 'sm' ? 15 : 18} color={fg} />}
          <ThemedText style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]} numberOfLines={1}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  md: {
    height: 50,
    paddingHorizontal: Spacing.three,
  },
  sm: {
    height: 36,
    paddingHorizontal: Spacing.three,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
  },
  labelSm: {
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
