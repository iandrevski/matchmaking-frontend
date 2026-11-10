import { StyleSheet, View } from 'react-native';

import { avatarColor } from '@/components/player-lineup';
import { ThemedText } from '@/components/themed-text';

type Props = {
  username: string;
  size?: number;
  ring?: string; // боја на прстен околу аватарот (пр. бело врз темна позадина)
};

export function Avatar({ username, size = 40, ring }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarColor(username),
        },
        ring && { borderWidth: Math.max(2, size / 22), borderColor: ring },
      ]}>
      <ThemedText style={[styles.initial, { fontSize: size * 0.4, lineHeight: size * 0.5 }]}>
        {username.charAt(0).toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#ffffff',
    fontWeight: 700,
  },
});
