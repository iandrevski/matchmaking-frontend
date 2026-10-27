import { useCallback, useEffect, useState } from 'react';
import { Link, useFocusEffect, useLocalSearchParams} from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches, getSports } from '@/api/client';
import type { Match, Sport } from '@/api/types';
import { MatchCard } from '@/components/match-card';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';

export default function MatchesScreen() {
    const params = useLocalSearchParams<{ sportId?: string }>();

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

    useEffect(() => {
        if (params.sportId) {
            setSelectedSportId(Number(params.sportId));
        }
    }, [params.sportId]);

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
                <View style={styles.header}>
                    <ThemedText type="subtitle">Matches</ThemedText>
                    <Link href="/matches/new" asChild>
                        <Pressable style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
                            <ThemedText type="smallBold" style={styles.newButtonText}>
                                + New
                            </ThemedText>
                        </Pressable>
                    </Link>
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    newButton: {
        backgroundColor: '#3c87f7',
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.three,
    },
    newButtonText: {
        color: '#ffffff',
    },
    pressed: {
        opacity: 0.8,
    },
});