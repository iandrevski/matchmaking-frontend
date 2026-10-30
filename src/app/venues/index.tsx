import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSports, getVenues } from '@/api/client';
import type { Sport, Venue } from '@/api/types';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VenueCard } from '@/components/venue-card';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';

export default function VenuesScreen() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadVenues = useCallback(async () => {
        try {
            setError(null);
            setVenues(await getVenues(selectedSportId ?? undefined));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }, [selectedSportId]);

    useEffect(() => {
        getSports().then(setSports).catch(() => {});
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadVenues().finally(() => setLoading(false));
        }, [loadVenues]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadVenues();
        setRefreshing(false);
    }, [loadVenues]);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">Venues</ThemedText>

                <SportFilter sports={sports} selectedId={selectedSportId} onSelect={setSelectedSportId} />

                {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loader} />
                ) : (
                    <FlatList
                        data={venues}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <VenueCard venue={item} />}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            !error ? (
                                <ThemedText themeColor="textSecondary">
                                    {selectedSportId ? 'No venues for this sport yet.' : 'No venues yet.'}
                                </ThemedText>
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
    list: {
        gap: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.three,
    },
    loader: {
        marginTop: Spacing.five,
    },
    error: {
        color: '#e5484d',
    },
});