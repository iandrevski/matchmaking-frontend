import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getMessages } from '@/api/client';
import type { Message } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, IconBadge } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { timeAgo } from '@/utils/time';

// картичка во деталите: последната порака и влез во чатот
export function LobbyChatCard({ matchId }: { matchId: number }) {
    const [last, setLast] = useState<Message | null>(null);

    useFocusEffect(
        useCallback(() => {
            getMessages(matchId)
                .then((list) => setLast(list.at(-1) ?? null))
                .catch(() => setLast(null));
        }, [matchId]),
    );

    return (
        <Pressable
            onPress={() => router.push({ pathname: '/matches/chat/[id]', params: { id: matchId } })}
            accessibilityRole="button"
            accessibilityLabel="Open lobby chat"
            style={({ pressed }) => pressed && styles.pressed}>
            <Card style={styles.card}>
                <IconBadge name="message-circle" size={42} />
                <View style={styles.text}>
                    <View style={styles.titleRow}>
                        <ThemedText type="smallBold" style={styles.flex}>
                            Lobby chat
                        </ThemedText>
                        {last && (
                            <ThemedText style={styles.ago} themeColor="textSecondary">
                                {timeAgo(last.createdAt)}
                            </ThemedText>
                        )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {last ? `${last.senderUsername}: ${last.text}` : 'Say hi to your teammates'}
                    </ThemedText>
                </View>
                <Icon name="chevron-right" size={18} tone="textSecondary" />
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    text: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    flex: {
        flex: 1,
    },
    ago: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 600,
    },
    pressed: {
        opacity: 0.85,
    },
});
