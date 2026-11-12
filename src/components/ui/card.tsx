import { StyleSheet, View, type ViewProps } from 'react-native';

import { Brand, CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & {
  // dark = темно зелен „hero“ блок
  variant?: 'default' | 'dark';
};

// бела картичка со мека сенка; основен блок на секој екран
export function Card({ variant = 'default', style, ...rest }: Props) {
  const theme = useTheme();
  const dark = variant === 'dark';
  return (
    <View
      style={[
        styles.card,
        dark ? styles.dark : [{ backgroundColor: theme.backgroundElement }, CardShadow],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dark: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    overflow: 'hidden',
  },
});
