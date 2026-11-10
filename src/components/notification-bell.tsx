import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotificationsSheet } from '@/components/notifications-sheet';
import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/notifications/notifications-context';

type Props = {
    onDark?: boolean; // врз темно зелен hero блок
};

export function NotificationBell({ onDark }: Props) {
    const theme = useTheme();
    const { unreadCount } = useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                style={({ pressed }) => [
                    styles.button,
                    onDark
                        ? { backgroundColor: Brand.onDarkFaint }
                        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
                    pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.icon}>🔔</ThemedText>
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</ThemedText>
                    </View>
                )}
            </Pressable>
            <NotificationsSheet visible={open} onClose={() => setOpen(false)} />
        </>
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
    icon: {
        fontSize: 18,
        lineHeight: 24,
    },
    badge: {
        position: 'absolute',
        top: -3,
        right: -3,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 5,
        borderRadius: 10,
        backgroundColor: Brand.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 10,
        lineHeight: 14,
        fontWeight: 700,
    },
    pressed: {
        opacity: 0.7,
    },
});
