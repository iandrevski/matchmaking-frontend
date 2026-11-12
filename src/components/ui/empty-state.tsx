import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconBadge, type IconName } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';

type Props = {
  icon: IconName;
  title: string;
  text?: string;
  children?: React.ReactNode; // пр. копче
};

export function EmptyState({ icon, title, text, children }: Props) {
  return (
    <Card style={styles.card}>
      <IconBadge name={icon} size={52} />
      <ThemedText type="smallBold" style={styles.center}>
        {title}
      </ThemedText>
      {text && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {text}
        </ThemedText>
      )}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
