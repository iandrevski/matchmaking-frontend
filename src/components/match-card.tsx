import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Match, MatchStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Brand, Spacing } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { useTheme } from '@/hooks/use-theme';
import { durationMinutes, formatDayTime } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

export const STATUS_LABELS: Record<MatchStatus, string> = {
    OPEN: 'Open match',
    FULL: 'Full match',
    FINISHED: 'Finished',
    CANCELLED: 'Cancelled',
};

export const STATUS_COLORS: Record<MatchStatus, string> = {
    OPEN: Brand.success,
    FULL: Brand.warning,
    FINISHED: '#8b8d98',
    CANCELLED: Brand.danger,
};

const MAX_SLOTS = 5; // колку места се цртаат; остатокот е „+N“

type Props = {
    match: Match;
    linked?: boolean; // false за партнер: тој нема екран за детали на натпревар
};

export function MatchCard({ match, linked = true }: Props) {
    const theme = useTheme();
    const { isFavoriteMatch } = useFavorites();
    const max = match.sport.numberOfPlayers;
    const spotsLeft = Math.max(max - match.participantsCount, 0);
    const isOpen = match.status === 'OPEN';

    // места: прво играчите, па празни места; ако ги има премногу → „+N“
    const slots: (string | null)[] = [
        ...match.participants.map((p) => p.username),
        ...Array<null>(spotsLeft).fill(null),
    ];
    const shown = slots.length > MAX_SLOTS ? slots.slice(0, MAX_SLOTS - 1) : slots;
    const hidden = slots.length - shown.length;

    const card = (
        <Card style={styles.card}>
            {/* горе: спорт + статус, ознаки десно */}
            <View style={styles.top}>
                <View style={styles.kind}>
                    <ThemedText style={styles.kindEmoji}>{sportEmoji(match.sport.name)}</ThemedText>
                    <ThemedText style={[styles.kindText, { color: STATUS_COLORS[match.status] }]} numberOfLines={1}>
                        {STATUS_LABELS[match.status].toUpperCase()}
                    </ThemedText>
                </View>
                {isFavoriteMatch(match.id) && <ThemedText style={styles.heart}>❤️</ThemedText>}
                <Tag label={`${durationMinutes(match.dateFrom, match.dateTo)} MIN`} />
                <Tag label={`${match.participantsCount}/${max}`} />
            </View>

            {/* кога и каде */}
            <View>
                <ThemedText style={styles.when}>{formatDayTime(match.dateFrom)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {match.sport.name} · {match.venueName}
                </ThemedText>
            </View>

            {/* играчи и празни места */}
            <View style={styles.slots}>
                {shown.map((username, i) =>
                    username ? (
                        <View key={`p-${i}`} style={styles.slot}>
                            <Avatar username={username} size={40} />
                            <ThemedText style={styles.slotName} numberOfLines={1}>
                                {username}
                            </ThemedText>
                        </View>
                    ) : (
                        <View key={`e-${i}`} style={styles.slot}>
                            <View style={[styles.empty, { borderColor: isOpen ? theme.tint : theme.border }]}>
                                <ThemedText style={[styles.plus, { color: isOpen ? theme.tint : theme.textSecondary }]}>
                                    +
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.slotName, { color: theme.textSecondary }]}>
                                {isOpen ? 'Join' : 'Open'}
                            </ThemedText>
                        </View>
                    ),
                )}
                {hidden > 0 && (
                    <View style={styles.slot}>
                        <View style={[styles.more, { backgroundColor: theme.backgroundSelected }]}>
                            <ThemedText type="smallBold">+{hidden}</ThemedText>
                        </View>
                        <ThemedText style={[styles.slotName, { color: theme.textSecondary }]}>more</ThemedText>
                    </View>
                )}
            </View>

            {/* долу: организатор + слободни места */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
                    {match.organizerUsername ? `by ${match.organizerUsername}` : ' '}
                </ThemedText>
                {isOpen && (
                    <ThemedText type="smallBold" themeColor="tint">
                        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                    </ThemedText>
                )}
            </View>
        </Card>
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
        gap: Spacing.three,
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    kind: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    kindEmoji: {
        fontSize: 15,
        lineHeight: 20,
    },
    kindText: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 800,
        letterSpacing: 0.6,
    },
    heart: {
        fontSize: 14,
        lineHeight: 18,
    },
    when: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: 700,
    },
    slots: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    slot: {
        width: 52,
        alignItems: 'center',
        gap: Spacing.one,
    },
    slotName: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 600,
        maxWidth: 52,
    },
    empty: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plus: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: 500,
    },
    more: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingTop: Spacing.two,
        borderTopWidth: 1,
    },
    flex: {
        flex: 1,
    },
});
