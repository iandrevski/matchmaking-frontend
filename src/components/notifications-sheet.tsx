import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/client';
import type { AppNotification, NotificationType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/notifications/notifications-context';
import { timeAgo } from '@/utils/time';

const ACCENT = '#3c87f7';

// боја на ознаката лево, по тип
const TYPE_COLORS: Record<NotificationType, string> = {
    PLAYER_JOINED: '#3e63dd',
    MATCH_FULL: '#30a46c',
    MATCH_CANCELLED: '#e5484d',
    MATCH_REMINDER: '#f76b15',
    REVIEW_REQUEST: '#f5a524',
    NEW_MESSAGE: '#8e4ec6',
};

type Props = {
    visible: boolean;
    onClose: () => void;
};

export function NotificationsSheet({ visible, onClose }: Props) {
    const theme = useTheme();
    const { setUnreadCount, refreshUnread } = useNotifications();
    const [items, setItems] = useState<AppNotification[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // листата се вчитува секогаш кога се отвора
    useEffect(() => {
        if (!visible) return;
        setError(null);
        getNotifications()
            .then(setItems)
            .catch((e) => setError(e instanceof Error ? e.message : 'Could not load notifications'));
    }, [visible]);

    const hasUnread = items?.some((n) => !n.read) ?? false;

    async function openNotification(notification: AppNotification) {
        onClose();
        if (!notification.read) {
            markNotificationRead(notification.id).finally(refreshUnread);
        }
        if (notification.matchId === null) return;
        // пораките водат во чатот, сè друго во деталите на натпреварот
        if (notification.type === 'NEW_MESSAGE') {
            router.push({ pathname: '/matches/chat/[id]', params: { id: notification.matchId } });
        } else {
            router.push({ pathname: '/matches/[id]', params: { id: notification.matchId } });
        }
    }

    async function markAll() {
        const { count } = await markAllNotificationsRead();
        setUnreadCount(count);
        setItems((current) => current?.map((n) => ({ ...n, read: true })) ?? null);
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close notifications" />
                <ThemedView style={styles.sheet}>
                    <SafeAreaView edges={['bottom']} style={styles.flex}>
                        <View style={styles.header}>
                            <ThemedText type="subtitle" style={styles.title}>
                                Notifications
                            </ThemedText>
                            {hasUnread && (
                                <Pressable onPress={markAll} style={({ pressed }) => pressed && styles.pressed}>
                                    <ThemedText type="small" style={styles.accent}>
                                        Mark all read
                                    </ThemedText>
                                </Pressable>
                            )}
                            <Pressable
                                onPress={onClose}
                                accessibilityLabel="Close"
                                style={({ pressed }) => [styles.close, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                                <ThemedText>✕</ThemedText>
                            </Pressable>
                        </View>

                        {error ? (
                            <ThemedText style={styles.error}>{error}</ThemedText>
                        ) : items === null ? (
                            <ActivityIndicator style={styles.loader} />
                        ) : (
                            <FlatList
                                data={items}
                                keyExtractor={(item) => String(item.id)}
                                contentContainerStyle={styles.list}
                                renderItem={({ item }) => <Row notification={item} onPress={() => openNotification(item)} />}
                                ListEmptyComponent={
                                    <View style={styles.empty}>
                                        <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
                                        <ThemedText type="small" themeColor="textSecondary">
                                            You&apos;re all caught up.
                                        </ThemedText>
                                    </View>
                                }
                            />
                        )}
                    </SafeAreaView>
                </ThemedView>
            </View>
        </Modal>
    );
}

function Row({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
    const theme = useTheme();
    const unread = !notification.read;

    return (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
            <View
                style={[
                    styles.row,
                    { backgroundColor: unread ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                <View style={[styles.stripe, { backgroundColor: TYPE_COLORS[notification.type] }]} />
                <View style={styles.rowText}>
                    <View style={styles.rowHeader}>
                        <ThemedText type={unread ? 'smallBold' : 'small'} style={styles.rowTitle} numberOfLines={1}>
                            {notification.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            {timeAgo(notification.createdAt)}
                        </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                        {notification.body}
                    </ThemedText>
                </View>
                {unread && <View style={styles.dot} />}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        width: '100%',
        maxWidth: MaxContentWidth,
        height: '80%',
        borderTopLeftRadius: Spacing.four,
        borderTopRightRadius: Spacing.four,
        overflow: 'hidden',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.two,
    },
    title: {
        flex: 1,
    },
    accent: {
        color: ACCENT,
    },
    close: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingHorizontal: Spacing.three,
        paddingBottom: Spacing.four,
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingRight: Spacing.three,
        borderRadius: Spacing.three,
        overflow: 'hidden',
    },
    stripe: {
        width: 4,
        alignSelf: 'stretch',
    },
    rowText: {
        flex: 1,
        paddingVertical: Spacing.three,
        gap: Spacing.half,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    rowTitle: {
        flex: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ACCENT,
    },
    empty: {
        alignItems: 'center',
        gap: Spacing.one,
        paddingTop: Spacing.six,
    },
    emptyIcon: {
        fontSize: 36,
        lineHeight: 44,
    },
    loader: {
        marginTop: Spacing.five,
    },
    error: {
        color: '#e5484d',
        padding: Spacing.four,
    },
    pressed: {
        opacity: 0.7,
    },
});