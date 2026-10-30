import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Match, MatchStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMatchDate, formatTime } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

const STATUS_COLORS: Record<MatchStatus, string> = {
    OPEN: '#30a46c',
    FULL: '#f76b15',
    FINISHED: '#8b8d98',
    CANCELLED: '#e5484d',
};

type Props = {
    match: Match;
    linked?: boolean; // false за партнер: тој нема екран за детали на натпревар
};

export function MatchCard({ match, linked = true }: Props) {
    const theme = useTheme();
    const max = match.sport.numberOfPlayers;
    const fill = Math.min(match.participantsCount / max, 1);
    const spotsLeft = Math.max(max - match.participantsCount, 0);

    const card = (
        <ThemedView type="backgroundElement" style={styles.card}>
            {/* header: icon + sport + status */}
            <View style={styles.header}>
                <ThemedText style={styles.emoji}>{sportEmoji(match.sport.name)}</ThemedText>
                <View style={styles.headerText}>
                    <ThemedText type="smallBold">{match.sport.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {match.venueName}
                    </ThemedText>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[match.status] }]}>
                    <ThemedText style={styles.badgeText}>{match.status}</ThemedText>
                </View>
            </View>

            {/* time */}
            <ThemedText type="small">
                🕒 {formatMatchDate(match.dateFrom)} – {formatTime(match.dateTo)}
            </ThemedText>

            {/* players + progress */}
            <View style={styles.playersRow}>
                <ThemedText type="small" themeColor="textSecondary">
                    {match.participantsCount}/{max} players
                </ThemedText>
                {match.status === 'OPEN' && (
                    <ThemedText type="small" style={{ color: STATUS_COLORS.OPEN }}>
                        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                    </ThemedText>
                )}
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                    style={[
                        styles.fill,
                        { width: `${fill * 100}%`, backgroundColor: STATUS_COLORS[match.status] },
                    ]}
                />
            </View>
        </ThemedView>
    );

    if (!linked) {
        return card;
    }

    return (
        <Link href={{ pathname: '/matches/[id]', params: { id: match.id } }} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>{card}</Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.7,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    emoji: {
        fontSize: 28,
        lineHeight: 34,
    },
    headerText: {
        flex: 1,
    },
    badge: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.half,
        borderRadius: Spacing.two,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 11,
        lineHeight: 16,
        fontWeight: 700,
    },
    playersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 3,
    },
});