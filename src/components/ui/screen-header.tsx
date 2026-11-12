import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title?: string;
  subtitle?: string;
  fallback?: Href; // каде да оди „назад“ ако екранот е отворен директно (пр. линк на web)
  right?: React.ReactNode;
};

// горна лента за под-екраните: копче назад, наслов, акција десно
export function ScreenHeader({ title, subtitle, fallback = '/', right }: Props) {
  const theme = useTheme();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => [
          styles.back,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        <Icon name="chevron-left" size={22} />
      </Pressable>

      <View style={styles.titles}>
        {title && (
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
        )}
        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>

      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
