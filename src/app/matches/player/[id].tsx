import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPlayerReviewSummary } from '@/api/client';
import type { PlayerReviewSummary } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { ReportPlayerSheet } from '@/components/report-player-sheet';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { REVIEW_TAG_LABELS } from '@/utils/review-tags';

// јавен профил на играч: „со кого ќе играм?“
export default function PlayerProfileScreen() {
    const { id, matchId } = useLocalSearchParams<{ id: string; matchId?: string }>();
    const { user } = useAuth();
    const theme = useTheme();
    const [summary, setSummary] = useState<PlayerReviewSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reporting, setReporting] = useState(false);

    useEffect(() => {
        getPlayerReviewSummary(Number(id))
            .then(setSummary)
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'));
    }, [id]);

    if (!summary) {
        return (
            <ThemedView style={styles.centered}>
                {error ? (
                    <ThemedText style={styles.error}>{error}</ThemedText>
                ) : (
                    <ActivityIndicator size="large" color={theme.tint} />
                )}
            </ThemedView>
        );
    }

    const maxTag = Math.max(1, ...summary.tags.map((t) => t.count));
    // само играч може да пријави, и не самиот себе
    const canReport = user?.role === 'ROLE_USER' && user.id !== summary.playerId;
    const isNew = summary.averageStars === null;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* hero: кој е играчот */}
                    <Card variant="dark" style={styles.hero}>
                        <Avatar username={summary.username} size={88} ring="rgba(255,255,255,0.9)" />
                        <ThemedText style={styles.name}>{summary.username}</ThemedText>

                        {isNew ? (
                            <View style={styles.newBadge}>
                                <ThemedText style={styles.newBadgeText}>✦ NEW PLAYER</ThemedText>
                            </View>
                        ) : (
                            <View style={styles.ratingRow}>
                                <StarRating value={summary.averageStars ?? 0} size={18} />
                                <ThemedText style={styles.ratingText}>{summary.averageStars?.toFixed(1)}</ThemedText>
                            </View>
                        )}

                        <View style={[styles.stats, { borderTopColor: Brand.onDarkFaint }]}>
                            <Stat value={summary.matchesPlayed} label="Matches" />
                            <View style={styles.divider} />
                            <Stat value={summary.reviewCount} label="Reviews" />
                        </View>
                    </Card>

                    <Card style={styles.card}>
                        <ThemedText style={styles.sectionTitle}>What teammates say</ThemedText>
                        {summary.tags.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No highlights yet. They show up after teammates rate a finished match.
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
                    </Card>

                    <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                        Reviews come from teammates after finished matches and are anonymous.
                    </ThemedText>

                    {canReport && (
                        <Pressable
                            onPress={() => setReporting(true)}
                            accessibilityRole="button"
                            style={({ pressed }) => pressed && styles.pressed}>
                            <Card style={styles.report}>
                                <ThemedText style={styles.reportIcon}>🚩</ThemedText>
                                <View style={styles.reportBody}>
                                    <ThemedText type="smallBold">Had a problem with {summary.username}?</ThemedText>
                                    <ThemedText type="small" themeColor="textSecondary">
                                        Let us know. It stays private.
                                    </ThemedText>
                                </View>
                                <ThemedText themeColor="textSecondary">›</ThemedText>
                            </Card>
                        </Pressable>
                    )}
                </ScrollView>
            </SafeAreaView>

            <ReportPlayerSheet
                visible={reporting}
                onClose={() => setReporting(false)}
                playerId={summary.playerId}
                username={summary.username}
                matchId={matchId ? Number(matchId) : undefined}
            />
        </ThemedView>
    );
}

function Stat({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.stat}>
            <ThemedText style={styles.statValue}>{value}</ThemedText>
            <ThemedText style={styles.statLabel}>{label}</ThemedText>
        </View>
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
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    hero: {
        alignItems: 'center',
        gap: Spacing.two,
    },
    name: {
        color: Brand.onDark,
        fontSize: 28,
        lineHeight: 36,
        fontWeight: 700,
        marginTop: Spacing.one,
    },
    newBadge: {
        paddingHorizontal: Spacing.three,
        height: 26,
        justifyContent: 'center',
        borderRadius: 13,
        backgroundColor: Brand.accent,
    },
    newBadgeText: {
        color: Brand.onAccent,
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 800,
        letterSpacing: 0.6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    ratingText: {
        color: Brand.onDark,
        fontWeight: 700,
    },
    stats: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        marginTop: Spacing.two,
        paddingTop: Spacing.three,
        borderTopWidth: 1,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: Brand.onDark,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: 700,
    },
    statLabel: {
        color: Brand.onDarkMuted,
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        width: 1,
        backgroundColor: Brand.onDarkFaint,
    },
    card: {
        gap: Spacing.three,
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 700,
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
        backgroundColor: Brand.primary,
    },
    tagCount: {
        width: 32,
        textAlign: 'right',
    },
    note: {
        textAlign: 'center',
    },
    report: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    reportIcon: {
        fontSize: 20,
        lineHeight: 26,
    },
    reportBody: {
        flex: 1,
    },
    pressed: {
        opacity: 0.8,
    },
    error: {
        color: Brand.danger,
    },
});
