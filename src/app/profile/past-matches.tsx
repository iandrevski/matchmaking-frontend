import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPlayerMatches } from '@/api/client';
import type { Match } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { Chip } from '@/components/chip';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { SportIcon } from '@/components/ui/icon';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayTime } from '@/utils/format';
import { past } from '@/utils/matches';
import { ListSkeleton } from '@/components/ui/skeleton';

// „November 2026“ → натпревари од тој месец (листата е веќе од најнов кон најстар)
function groupByMonth(matches: Match[]) {
    const groups: { month: string; matches: Match[] }[] = [];
    for (const match of matches) {
        const month = new Date(match.dateFrom).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        const last = groups.at(-1);
        if (last?.month === month) last.matches.push(match);
        else groups.push({ month, matches: [match] });
    }
    return groups;
}

export default function PastMatchesScreen() {
    const { user } = useAuth();
    const theme = useTheme();
    const [matches, setMatches] = useState<Match[] | null>(null);
    const [sport, setSport] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getPlayerMatches(user.id)
                .then((all) => setMatches(past(all)))
                .catch(() => setMatches([]));
        }, [user]),
    );

    // филтер само за спортовите што навистина ги играл
    const sports = useMemo(() => [...new Set((matches ?? []).map((m) => m.sport.name))], [matches]);
    const groups = useMemo(
        () => groupByMonth((matches ?? []).filter((m) => sport === null || m.sport.name === sport)),
        [matches, sport],
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader
                        title="Past matches"
                        subtitle={matches ? `${matches.length} played` : undefined}
                        fallback="/profile"
                    />

                    {matches === null ? (
                        <ListSkeleton rows={4} />
                    ) : matches.length === 0 ? (
                        <EmptyState
                            icon="clock"
                            title="No matches played yet"
                            text="Your finished matches will show up here."
                        />
                    ) : (
                        <>
                            {sports.length > 1 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                                    <Chip label="All" selected={sport === null} onPress={() => setSport(null)} />
                                    {sports.map((name) => (
                                        <Chip
                                            key={name}
                                            label={name}
                                            selected={sport === name}
                                            onPress={() => setSport(name)}
                                            renderIcon={(color) => <SportIcon sport={name} size={17} color={color} />}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {groups.map((group) => (
                                <ListGroup key={group.month} label={group.month}>
                                    {group.matches.map((m) => (
                                        <ListRow
                                            key={m.id}
                                            leading={
                                                <View style={[styles.sportTile, { backgroundColor: theme.tintSoft }]}>
                                                    <SportIcon sport={m.sport.name} size={22} color={theme.tint} />
                                                </View>
                                            }
                                            title={`${m.sport.name} · ${m.venueName}`}
                                            subtitle={`${formatDayTime(m.dateFrom)} · ${m.participantsCount} ${m.participantsCount === 1 ? 'player' : 'players'}`}
                                            onPress={() =>
                                                router.push({ pathname: '/matches/[id]', params: { id: m.id } })
                                            }
                                        />
                                    ))}
                                </ListGroup>
                            ))}
                        </>
                    )}
                </ScrollView>
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
        paddingTop: TopTabInset,
    },
    content: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    loader: {
        marginTop: Spacing.five,
    },
    chips: {
        gap: Spacing.two,
    },
    sportTile: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
