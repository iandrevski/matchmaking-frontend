import { Children, Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, IconBadge, type IconName } from '@/components/ui/icon';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// група редови во една бела картичка (како Settings на iOS)
export function ListGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {label && <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label.toUpperCase()}</ThemedText>}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }, CardShadow]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  leading?: React.ReactNode; // наместо icon, пр. икона на спорт
  value?: string | number; // мал број/текст десно
  trailing?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, icon, leading, value, trailing, danger, onPress }: RowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      {leading ?? (icon && <IconBadge name={icon} size={38} danger={danger} />)}

      <View style={styles.text}>
        <ThemedText style={[styles.title, danger && styles.danger]} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>

      {value !== undefined && (
        <View style={[styles.value, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.valueText}>{value}</ThemedText>
        </View>
      )}
      {trailing}
      {onPress && !danger && <Icon name="chevron-right" size={18} tone="textSecondary" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 800,
    letterSpacing: 0.8,
    marginHorizontal: Spacing.one,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 700,
  },
  danger: {
    color: '#C23B3B',
  },
  value: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 800,
  },
});
