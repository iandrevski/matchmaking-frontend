import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotificationsSheet } from '@/components/notifications-sheet';
import { ThemedText } from '@/components/themed-text';
import { useNotifications } from '@/notifications/notifications-context';
import { useTheme } from '@/hooks/use-theme';

export function NotificationBell() {
    const theme = useTheme();
    const { unreadCount } = useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                style={({ pressed }) => [styles.button, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
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
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 18,
        lineHeight: 24,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: '#e5484d',
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