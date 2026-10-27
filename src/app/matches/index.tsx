import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches, getSports } from '@/api/client';
import type { Match, Sport } from '@/api/types';
import { MatchCard } from '@/components/match-card';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';

export default function MatchesScreen() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMatches = useCallback(async () => {
        try {
            setError(null);
            setMatches(await getMatches({ sportId: selectedSportId }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }, [selectedSportId]);

    // спортовите се вчитуваат еднаш
    useEffect(() => {
        getSports().then(setSports).catch(() => {});
    }, []);

    // натпреварите се вчитуваат секој пат кога екранот станува активен или се менува филтерот
    useFocusEffect(
        useCallback(() => {
            loadMatches().finally(() => setLoading(false));
        }, [loadMatches]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadMatches();
        setRefreshing(false);
    }, [loadMatches]);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">Matches</ThemedText>

                <SportFilter sports={sports} selectedId={selectedSportId} onSelect={setSelectedSportId} />

                {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loader} />
                ) : (
                    <FlatList
                        data={matches}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <MatchCard match={item} />}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            !error ? (
                                <ThemedText themeColor="textSecondary">
                                    {selectedSportId ? 'No matches for this sport yet.' : 'No matches yet.'}
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