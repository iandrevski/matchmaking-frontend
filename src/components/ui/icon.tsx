import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Feather>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string; // конкретна боја…
  tone?: ThemeColor; // …или боја од темата (text, tint, textSecondary)
};

// линиски икони (Feather) насекаде во апликацијата, наместо емоџи
export function Icon({ name, size = 20, color, tone = 'text' }: IconProps) {
  const theme = useTheme();
  return <Feather name={name} size={size} color={color ?? theme[tone]} />;
}

const SPORT_ICONS: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  football: 'soccer',
  basketball: 'basketball',
  tennis: 'tennis',
  volleyball: 'volleyball',
  handball: 'handball',
  'table tennis': 'table-tennis',
};

type SportIconProps = {
  sport: string;
  size?: number;
  color?: string;
};

export function SportIcon({ sport, size = 20, color }: SportIconProps) {
  const theme = useTheme();
  return (
    <MaterialCommunityIcons
      name={SPORT_ICONS[sport.toLowerCase()] ?? 'trophy-outline'}
      size={size}
      color={color ?? theme.text}
    />
  );
}

// икона во нежно зелено квадратче (редови во листи, празни состојби)
export function IconBadge({ name, size = 40, danger }: { name: IconName; size?: number; danger?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.32 },
        { backgroundColor: danger ? 'rgba(214,69,69,0.12)' : theme.tintSoft },
      ]}>
      <Feather name={name} size={size * 0.5} color={danger ? '#C23B3B' : theme.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
