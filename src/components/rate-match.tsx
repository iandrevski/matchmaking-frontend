import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { getMyMatchReviews, submitMatchReviews } from '@/api/client';
import type { Match, MyMatchReviews, ReviewTag } from '@/api/types';
import { Chip } from '@/components/chip';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMatchDate } from '@/utils/format';
import { REVIEW_TAG_LABELS, REVIEW_TAGS } from '@/utils/review-tags';

type PlayerDraft = { stars: number; tags: ReviewTag[] };

type Props = {
    match: Match;
    currentUserId: number;
};

// картичка „Rate this match“ на завршен натпревар
export function RateMatch({ match, currentUserId }: Props) {
    const theme = useTheme();
    const teammates = match.participants.filter((p) => p.id !== currentUserId);

    const [info, setInfo] = useState<MyMatchReviews | null>(null);
    const [players, setPlayers] = useState<Record<number, PlayerDraft>>({});
    const [venueStars, setVenueStars] = useState(0);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ако веќе оценил, формата се пополнува со неговите оценки
    useEffect(() => {
        getMyMatchReviews(match.id)
            .then((mine) => {
                setInfo(mine);
                setPlayers(
                    Object.fromEntries(mine.players.map((p) => [p.playerId, { stars: p.stars, tags: p.tags }])),
                );
                setVenueStars(mine.venue?.stars ?? 0);
                setComment(mine.venue?.comment ?? '');
            })
            .catch(() => setInfo(null));
    }, [match.id]);

    if (!info) {
        return null;
    }

    const alreadyReviewed = info.players.length > 0 || info.venue !== null;

    if (!info.canReview) {
        return alreadyReviewed ? (
            <ThemedText type="small" themeColor="textSecondary">
                ✅ You reviewed this match.
            </ThemedText>
        ) : null;
    }

    function setStars(playerId: number, stars: number) {
        setSaved(false);
        setPlayers((current) => ({ ...current, [playerId]: { stars, tags: current[playerId]?.tags ?? [] } }));
    }

    function toggleTag(playerId: number, tag: ReviewTag) {
        setSaved(false);
        setPlayers((current) => {
            const draft = current[playerId] ?? { stars: 0, tags: [] };
            const tags = draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag];
            return { ...current, [playerId]: { ...draft, tags } };
        });
    }

    // се праќаат само оние што имаат ѕвезди
    const ratedPlayers = Object.entries(players)
        .filter(([, draft]) => draft.stars > 0)
        .map(([playerId, draft]) => ({ playerId: Number(playerId), stars: draft.stars, tags: draft.tags }));
    const canSubmit = (ratedPlayers.length > 0 || venueStars > 0) && !saving;

    async function onSubmit() {
        setSaving(true);
        setError(null);
        try {
            const updated = await submitMatchReviews(match.id, {
                players: ratedPlayers,
                venue: venueStars > 0 ? { stars: venueStars, comment: comment.trim() || null } : null,
            });
            setInfo(updated);
            setSaved(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    return (
        <ThemedView type="backgroundElement" style={styles.card}>
            <View>
                <ThemedText type="smallBold">⭐ Rate this match</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    Reviews of players are anonymous. You can change them until{' '}
                    {formatMatchDate(info.reviewableUntil)}.
                </ThemedText>
            </View>

            {teammates.map((player) => {
                const draft = players[player.id] ?? { stars: 0, tags: [] };
                return (
                    <View key={player.id} style={styles.block}>
                        <View style={styles.playerRow}>
                            <Pressable
                                onPress={() => router.push({ pathname: '/matches/player/[id]', params: { id: player.id } })}>
                                <ThemedText type="smallBold" themeColor="tint" style={styles.link}>
                                    {player.username}
                                </ThemedText>
                            </Pressable>
                            <StarRating value={draft.stars} onChange={(stars) => setStars(player.id, stars)} />
                        </View>
                        <View style={styles.tags}>
                            {REVIEW_TAGS.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={REVIEW_TAG_LABELS[tag]}
                                    selected={draft.tags.includes(tag)}
                                    onPress={() => toggleTag(player.id, tag)}
                                />
                            ))}
                        </View>
                    </View>
                );
            })}

            <View style={styles.block}>
                <View style={styles.playerRow}>
                    <ThemedText type="smallBold">🏟️ {match.venueName}</ThemedText>
                    <StarRating
                        value={venueStars}
                        onChange={(stars) => {
                            setSaved(false);
                            setVenueStars(stars);
                        }}
                    />
                </View>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="How was the venue? (optional)"
                    placeholderTextColor={theme.textSecondary}
                    value={comment}
                    onChangeText={(text) => {
                        setSaved(false);
                        setComment(text);
                    }}
                    maxLength={500}
                    multiline
                />
            </View>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
            {saved && <ThemedText style={styles.success}>Thanks! Your reviews are saved.</ThemedText>}

            <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [styles.button, !canSubmit && styles.disabled, pressed && styles.pressed]}>
                {saving ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <ThemedText style={styles.buttonText}>{alreadyReviewed ? 'Update reviews' : 'Save reviews'}</ThemedText>
                )}
            </Pressable>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.three,
    },
    block: {
        gap: Spacing.two,
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.two,
    },
    link: {
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.one,
    },
    input: {
        minHeight: 64,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.two,
        fontSize: 15,
        textAlignVertical: 'top',
    },
    error: {
        color: '#e5484d',
    },
    success: {
        color: Brand.success,
    },
    button: {
        backgroundColor: Brand.primary,
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.8,
    },
    buttonText: {
        color: '#ffffff',
    },
});