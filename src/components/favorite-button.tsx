import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = {
    active: boolean;
    onToggle: () => Promise<void>;
};

export function FavoriteButton({ active, onToggle }: Props) {
    const theme = useTheme();
    const [busy, setBusy] = useState(false);

    async function press() {
        setBusy(true);
        try {
            await onToggle();
        } finally {
            setBusy(false);
        }
    }

    return (
        <Pressable
            onPress={press}
            disabled={busy}
            accessibilityLabel={active ? 'Remove from favorites' : 'Add to favorites'}
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.backgroundElement },
                active && styles.active,
                pressed && styles.pressed,
            ]}>
            {busy ? <ActivityIndicator size="small" /> : <ThemedText style={styles.icon}>{active ? '❤️' : '🤍'}</ThemedText>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    active: {
        backgroundColor: 'rgba(229,72,77,0.15)',
    },
    icon: {
        fontSize: 20,
        lineHeight: 26,
    },
    pressed: {
        opacity: 0.7,
    },
});