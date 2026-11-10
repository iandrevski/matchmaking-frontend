import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getMessages } from '@/api/client';
import type { Message } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

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
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.icon}>💬</ThemedText>
                <View style={styles.text}>
                    <ThemedText type="smallBold">Lobby chat</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {last ? `${last.senderUsername}: ${last.text}` : 'Say hi to your teammates 👋'}
                    </ThemedText>
                </View>
                <ThemedText type="smallBold" themeColor="tint" style={styles.open}>
                    Open ›
                </ThemedText>
            </ThemedView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.three,
        borderRadius: Spacing.three,
    },
    icon: {
        fontSize: 26,
        lineHeight: 32,
    },
    text: {
        flex: 1,
    },
    open: {
    },
    pressed: {
        opacity: 0.8,
    },
});