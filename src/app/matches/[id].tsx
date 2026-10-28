import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatch, joinMatch, leaveMatch } from '@/api/client';
import type { Match } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { formatMatchDate } from '@/utils/format';

import { useAuth } from '@/auth/auth-context';

export default function MatchDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const matchId = Number(id);
    const { user } = useAuth();

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMatch(matchId)
            .then(setMatch)
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [matchId]);

    // join or leave → the backend returns the updated match
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

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" />
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

    const isParticipant = user ? match.participantIds.includes(user.id) : false;
    const canJoin = !isParticipant && match.status === 'OPEN';

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">{match.sport.name}</ThemedText>

                <ThemedView type="backgroundElement" style={styles.card}>
                    <Row label="Venue" value={match.venueName} />
                    <Row label="When" value={formatMatchDate(match.dateFrom, 'long')} />
                    <Row label="Organizer" value={match.organizerUsername ?? '—'} />
                    <Row
                        label="Players"
                        value={`${match.participantsCount}/${match.sport.numberOfPlayers}`}
                    />
                    <Row label="Status" value={match.status} />
                </ThemedView>

                {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                {isParticipant ? (
                    <ActionButton
                        label="Leave match"
                        variant="secondary"
                        loading={submitting}
                        onPress={() => runAction(leaveMatch)}
                    />
                ) : (
                    <ActionButton
                        label={canJoin ? 'Join match' : match.status}
                        disabled={!canJoin}
                        loading={submitting}
                        onPress={() => runAction(joinMatch)}
                    />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
                {label}
            </ThemedText>
            <ThemedText type="smallBold">{value}</ThemedText>
        </ThemedView>
    );
}

type ActionButtonProps = {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
};

function ActionButton({ label, onPress, loading, disabled, variant = 'primary' }: ActionButtonProps) {
    const inactive = disabled || loading;
    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            style={({ pressed }) => [
                styles.button,
                variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
                inactive && styles.buttonDisabled,
                pressed && styles.buttonPressed,
            ]}>
            {loading ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <ThemedText style={styles.buttonText}>{label}</ThemedText>
            )}
        </Pressable>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    error: {
        color: '#e5484d',
    },
    button: {
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#3c87f7',
    },
    buttonSecondary: {
        backgroundColor: '#e5484d',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonText: {
        color: '#ffffff',
    },
});