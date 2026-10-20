import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches } from '@/api/client';
import type { Match } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {BottomTabInset, MaxContentWidth, Spacing, TopTabInset} from '@/constants/theme';
import { MatchCard } from '@/components/match-card';

export default function MatchesScreen() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMatches = useCallback(async () => {
        try {
            setError(null);
            setMatches(await getMatches());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }, []);

    useEffect(() => {
        loadMatches().finally(() => setLoading(false));
    }, [loadMatches]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadMatches();
        setRefreshing(false);
    }, [loadMatches]);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">Matches</ThemedText>

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
                                <ThemedText themeColor="textSecondary">No matches yet.</ThemedText>
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
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.one,
    },
    loader: {
        marginTop: Spacing.five,
    },
    error: {
        color: '#e5484d',
    },
});