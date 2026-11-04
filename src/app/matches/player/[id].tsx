import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPlayerReviewSummary } from '@/api/client';
import type { PlayerReviewSummary } from '@/api/types';
import { avatarColor } from '@/components/player-lineup';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { REVIEW_TAG_LABELS } from '@/utils/review-tags';

// јавен профил на играч: „со кого ќе играм?“
export default function PlayerProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const [summary, setSummary] = useState<PlayerReviewSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPlayerReviewSummary(Number(id))
            .then(setSummary)
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'));
    }, [id]);

    if (!summary) {
        return (
            <ThemedView style={styles.centered}>
                {error ? <ThemedText style={styles.error}>{error}</ThemedText> : <ActivityIndicator size="large" />}
            </ThemedView>
        );
    }

    const maxTag = Math.max(1, ...summary.tags.map((t) => t.count));

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.hero}>
                        <View style={[styles.avatar, { backgroundColor: avatarColor(summary.username) }]}>
                            <ThemedText style={styles.initial}>{summary.username.charAt(0).toUpperCase()}</ThemedText>
                        </View>
                        <ThemedText type="subtitle">{summary.username}</ThemedText>

                        {summary.averageStars !== null ? (
                            <View style={styles.ratingRow}>
                                <StarRating value={summary.averageStars} size={22} />
                                <ThemedText type="smallBold">
                                    {summary.averageStars.toFixed(1)} · {summary.reviewCount} reviews
                                </ThemedText>
                            </View>
                        ) : (
                            <ThemedView type="backgroundSelected" style={styles.badge}>
                                <ThemedText type="small">
                                    🆕 New player{summary.reviewCount > 0 ? ` · ${summary.reviewCount} reviews so far` : ''}
                                </ThemedText>
                            </ThemedView>
                        )}
                    </View>

                    <View style={styles.stats}>
                        <Stat label="Matches played" value={String(summary.matchesPlayed)} />
                        <Stat label="Reviews" value={String(summary.reviewCount)} />
                    </View>

                    <ThemedView type="backgroundElement" style={styles.card}>
                        <ThemedText type="smallBold">What teammates say</ThemedText>
                        {summary.tags.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No highlights yet.
                            </ThemedText>
                        ) : (
                            summary.tags.map((item) => (
                                <View key={item.tag} style={styles.tagRow}>
                                    <ThemedText type="small" style={styles.tagLabel}>
                                        {REVIEW_TAG_LABELS[item.tag]}
                                    </ThemedText>
                                    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                                        <View style={[styles.fill, { width: `${(item.count / maxTag) * 100}%` }]} />
                                    </View>
                                    <ThemedText type="smallBold" style={styles.tagCount}>
                                        ×{item.count}
                                    </ThemedText>
                                </View>
                            ))
                        )}
                    </ThemedView>

                    <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                        Reviews come from teammates after finished matches and are anonymous.
                    </ThemedText>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <ThemedView type="backgroundElement" style={styles.stat}>
            <ThemedText style={styles.statValue}>{value}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
                {label}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingTop: TopTabInset,
    },
    content: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    hero: {
        alignItems: 'center',
        gap: Spacing.two,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: {
        color: '#ffffff',
        fontSize: 36,
        lineHeight: 44,
        fontWeight: 700,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    badge: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Spacing.three,
    },
    stats: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    stat: {
        flex: 1,
        padding: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: 700,
    },
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    tagLabel: {
        width: 140,
    },
    track: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#3c87f7',
    },
    tagCount: {
        width: 32,
        textAlign: 'right',
    },
    note: {
        textAlign: 'center',
    },
    error: {
        color: '#e5484d',
    },
});