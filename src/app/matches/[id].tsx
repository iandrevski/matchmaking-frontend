import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancelMatch, getMatch, joinMatch, leaveMatch } from '@/api/client';
import type { Match } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { FavoriteButton } from '@/components/favorite-button';
import { LobbyChatCard } from '@/components/lobby-chat-card';
import { STATUS_COLORS, STATUS_LABELS } from '@/components/match-card';
import { PlayerLineup } from '@/components/player-lineup';
import { RateMatch } from '@/components/rate-match';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { SportIcon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Tag } from '@/components/ui/tag';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { useTheme } from '@/hooks/use-theme';
import { durationMinutes, formatDayTime, formatTime } from '@/utils/format';

export default function MatchDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const matchId = Number(id);
    const theme = useTheme();
    const { user } = useAuth();
    const { isFavoriteMatch, toggleMatch } = useFavorites();

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMatch(matchId)
            .then(setMatch)
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [matchId]);

    // join, leave или cancel → backend-от го враќа ажурираниот натпревар
    const runAction = useCallback(
        async (action: (matchId: number) => Promise<Match>) => {
            setSubmitting(true);
            setError(null);
            try {
                setMatch(await action(matchId));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong');
            } finally {
                setSubmitting(false);
            }
        },
        [matchId],
    );

    // откажувањето не може да се врати, затоа првиот клик бара потврда
    function onCancelPress() {
        if (!confirmCancel) {
            setConfirmCancel(true);
            return;
        }
        setConfirmCancel(false);
        runAction(cancelMatch);
    }

    function openPlayer(playerId: number) {
        router.push({ pathname: '/matches/player/[id]', params: { id: playerId, matchId: match?.id } });
    }

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={theme.tint} />
            </ThemedView>
        );
    }

    if (!match) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={styles.error}>{error ?? 'Match not found'}</ThemedText>
            </ThemedView>
        );
    }

    const max = match.sport.numberOfPlayers;
    const spotsLeft = Math.max(max - match.participantsCount, 0);
    const isActive = match.status === 'OPEN' || match.status === 'FULL';
    const isParticipant = user ? match.participantIds.includes(user.id) : false;
    const isOrganizer = user?.id === match.organizerId;
    const canJoin = !isParticipant && match.status === 'OPEN';
    const isPlayer = user?.role === 'ROLE_USER';

    // текст до копчето долу
    const footerTitle = isParticipant && isActive
        ? "You're in"
        : match.status === 'OPEN'
          ? `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`
          : STATUS_LABELS[match.status];
    const footerSubtitle = isParticipant && isActive ? 'See you on the field' : 'Free to join';

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader
                        fallback="/matches"
                        right={
                            isPlayer && (
                                <FavoriteButton active={isFavoriteMatch(match.id)} onToggle={() => toggleMatch(match.id)} />
                            )
                        }
                    />

                    {/* hero: што, кога, каде */}
                    <Card variant="dark" style={styles.hero}>
                        <View style={[styles.status, { backgroundColor: STATUS_COLORS[match.status] }]}>
                            <ThemedText style={styles.statusText}>{STATUS_LABELS[match.status].toUpperCase()}</ThemedText>
                        </View>

                        <View>
                            <View style={styles.sportRow}>
                                <SportIcon sport={match.sport.name} size={18} color={Brand.accent} />
                                <ThemedText style={styles.heroSport}>{match.sport.name}</ThemedText>
                            </View>
                            <ThemedText style={styles.heroWhen}>{formatDayTime(match.dateFrom)}</ThemedText>
                            <ThemedText style={styles.heroMuted}>until {formatTime(match.dateTo)}</ThemedText>
                        </View>

                        <View style={styles.tags}>
                            <Tag variant="onDark" label={`${durationMinutes(match.dateFrom, match.dateTo)} MIN`} />
                            <Tag variant="onDark" label={`${match.participantsCount}/${max} PLAYERS`} />
                        </View>

                        <View style={[styles.heroInfo, { borderTopColor: Brand.onDarkFaint }]}>
                            <Info label="Venue" value={match.venueName} />
                            <Info label="Organizer" value={match.organizerUsername ?? '—'} />
                        </View>
                    </Card>

                    {isParticipant && <LobbyChatCard matchId={match.id} />}

                    {/* оценувањето е најважно по завршен натпревар, затоа е горе */}
                    {match.status === 'FINISHED' && isParticipant && user && (
                        <RateMatch match={match} currentUserId={user.id} />
                    )}

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={styles.sectionTitle}>Players</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                                {match.participantsCount} of {max}
                            </ThemedText>
                        </View>
                        <PlayerLineup
                            match={match}
                            currentUserId={user?.id}
                            canJoin={canJoin && !submitting}
                            onJoin={() => runAction(joinMatch)}
                            onPlayerPress={openPlayer}
                        />
                        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                            Tap a player to see their profile.
                        </ThemedText>
                    </View>

                    {error && !isActive && (
                        <ThemedText type="small" style={styles.error}>
                            {error}
                        </ThemedText>
                    )}

                    {isOrganizer && isActive && (
                        <Pressable onPress={onCancelPress} disabled={submitting} style={styles.cancel} hitSlop={8}>
                            <ThemedText type="smallBold" style={styles.cancelText}>
                                {confirmCancel ? 'Tap again to cancel the match' : 'Cancel match'}
                            </ThemedText>
                        </Pressable>
                    )}
                </ScrollView>

                {/* главната акција е секогаш долу, на дофат на палецот (само за активни натпревари) */}
                {isPlayer && isActive && (
                    <View style={[styles.footer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
                        {error && (
                            <ThemedText type="small" style={styles.error} numberOfLines={2}>
                                {error}
                            </ThemedText>
                        )}
                        <View style={styles.footerRow}>
                            <View style={styles.flex}>
                                <ThemedText style={styles.footerTitle}>{footerTitle}</ThemedText>
                                {isActive && (
                                    <ThemedText type="small" themeColor="textSecondary">
                                        {footerSubtitle}
                                    </ThemedText>
                                )}
                            </View>
                            {isParticipant && isActive ? (
                                <PillButton
                                    label="Leave"
                                    variant="danger"
                                    loading={submitting}
                                    onPress={() => runAction(leaveMatch)}
                                    style={styles.footerButton}
                                />
                            ) : (
                                <PillButton
                                    label="Join match"
                                    disabled={!canJoin}
                                    loading={submitting}
                                    onPress={() => runAction(joinMatch)}
                                    style={styles.footerButton}
                                />
                            )}
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.info}>
            <ThemedText style={styles.infoLabel}>{label.toUpperCase()}</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={1}>
                {value}
            </ThemedText>
        </View>
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
        paddingBottom: Spacing.five,
        gap: Spacing.four,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flex: {
        flex: 1,
    },
    hero: {
        gap: Spacing.three,
    },
    status: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.two,
        height: 24,
        justifyContent: 'center',
        borderRadius: 12,
    },
    statusText: {
        color: '#ffffff',
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 800,
        letterSpacing: 0.6,
    },
    sportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    heroSport: {
        color: Brand.accent,
        fontWeight: 800,
    },
    heroWhen: {
        color: Brand.onDark,
        fontSize: 30,
        lineHeight: 38,
        fontWeight: 800,
        letterSpacing: -0.6,
    },
    heroMuted: {
        color: Brand.onDarkMuted,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    heroInfo: {
        flexDirection: 'row',
        gap: Spacing.three,
        paddingTop: Spacing.three,
        borderTopWidth: 1,
    },
    info: {
        flex: 1,
        gap: Spacing.half,
    },
    infoLabel: {
        color: Brand.onDarkMuted,
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 800,
        letterSpacing: 0.6,
    },
    infoValue: {
        color: Brand.onDark,
        fontWeight: 700,
    },
    section: {
        gap: Spacing.three,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    sectionTitle: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: 800,
    },
    center: {
        textAlign: 'center',
    },
    cancel: {
        alignSelf: 'center',
        paddingVertical: Spacing.two,
    },
    cancelText: {
        color: Brand.danger,
    },
    footer: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.three,
        borderTopWidth: 1,
        gap: Spacing.two,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    footerTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 800,
    },
    footerButton: {
        minWidth: 150,
    },
    error: {
        color: Brand.danger,
    },
});
