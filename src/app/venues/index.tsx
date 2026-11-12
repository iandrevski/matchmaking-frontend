import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSports, getVenues } from '@/api/client';
import type { Sport, Venue } from '@/api/types';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { VenueCardSkeleton } from '@/components/ui/skeleton';
import { VenueCard } from '@/components/venue-card';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function VenuesScreen() {
    const theme = useTheme();
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
                <View style={styles.header}>
                    <ThemedText type="subtitle">Venues</ThemedText>
                    <ThemedText themeColor="textSecondary">Find a place to play</ThemedText>
                </View>

                <SportFilter sports={sports} selectedId={selectedSportId} onSelect={setSelectedSportId} />

                {error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

                {loading ? (
                    <View style={styles.list}>
                        <VenueCardSkeleton />
                        <VenueCardSkeleton />
                    </View>
                ) : (
                    <FlatList
                        data={venues}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <VenueCard venue={item} />}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                        ListEmptyComponent={
                            !error ? (
                                <EmptyState
                                    icon="map-pin"
                                    title={selectedSportId ? 'No venues for this sport yet' : 'No venues yet'}
                                    text="New places are added by venue owners."
                                />
                            ) : undefined
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
        paddingHorizontal: Spacing.three,
        paddingTop: TopTabInset + Spacing.three,
        gap: Spacing.three,
    },
    header: {
        paddingHorizontal: Spacing.one,
    },
    list: {
        gap: Spacing.three,
        paddingTop: Spacing.one,
        paddingBottom: BottomTabInset + Spacing.four,
    },
    error: {
        color: Brand.danger,
    },
});
