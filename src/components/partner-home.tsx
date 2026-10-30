import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyVenues } from '@/api/client';
import type { Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VenueCard } from '@/components/venue-card';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';

export function PartnerHome() {
    const { user, logout } = useAuth();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getMyVenues(user.id)
                .then((list) => {
                    setError(null);
                    setVenues(list);
                })
                .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
                .finally(() => setLoading(false));
        }, [user]),
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <ThemedText type="subtitle">Hi, {user?.username} 👋</ThemedText>
                        <ThemedText themeColor="textSecondary">Manage your venues</ThemedText>
                    </View>
                    <Pressable onPress={logout} style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="small" style={styles.link}>
                            Log out
                        </ThemedText>
                    </Pressable>
                </View>

                <Link href="/venues/new" asChild>
                    <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
                        <ThemedText style={styles.ctaText}>+ Add a venue</ThemedText>
                    </Pressable>
                </Link>

                {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                {loading ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <FlatList
                        data={venues}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <VenueCard venue={item} />}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            !error ? (
                                <ThemedText themeColor="textSecondary">You have no venues yet.</ThemedText>
                            ) : null
                        }
                    />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingHorizontal: Spacing.four,
        paddingTop: TopTabInset + Spacing.four,
        gap: Spacing.three,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.three,
    },
    headerText: {
        flex: 1,
    },
    link: {
        color: '#3c87f7',
    },
    cta: {
        backgroundColor: '#3c87f7',
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    ctaText: {
        color: '#ffffff',
        fontWeight: 700,
    },
    list: {
        gap: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.three,
    },
    error: {
        color: '#e5484d',
    },
    pressed: {
        opacity: 0.8,
    },
});