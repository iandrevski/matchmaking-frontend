import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  variant?: 'outline' | 'onDark' | 'solid';
  color?: string; // за solid (пр. статус)
};

// мала ознака: „60 MIN“, „1/10“, „OPEN“
export function Tag({ label, variant = 'outline', color }: Props) {
  const theme = useTheme();
  const solid = variant === 'solid';
  const onDark = variant === 'onDark';

  return (
    <View
      style={[
        styles.tag,
        solid && { backgroundColor: color ?? theme.tint, borderColor: 'transparent' },
        onDark && styles.onDark,
        variant === 'outline' && { borderColor: theme.border },
      ]}>
      <ThemedText
        style={[styles.text, solid || onDark ? styles.light : { color: theme.textSecondary }]}
        numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: Spacing.two,
    height: 24,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  onDark: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  light: {
    color: '#ffffff',
  },
});
