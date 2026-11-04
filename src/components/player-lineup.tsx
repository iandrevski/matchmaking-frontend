import { Pressable, StyleSheet, View } from 'react-native';

import type { Match, Participant } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const SURFACES: Record<string, string> = {
    football: '#2f7d4f',
    basketball: '#c47435',
    tennis: '#2f6f9f',
    volleyball: '#b8892b',
    handball: '#3f5fa8',
    'table tennis': '#28776b',
};

const AVATAR_COLORS = ['#e5484d', '#8e4ec6', '#3e63dd', '#0090ff', '#12a594', '#f76b15', '#d6409f', '#6e56cf'];

// исто име → секогаш иста боја (се користи и на профилот на играч)
export function avatarColor(username: string) {
    const hash = [...username].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return AVATAR_COLORS.at(hash % AVATAR_COLORS.length);
}

type Props = {
    match: Match;
    currentUserId?: number;
    canJoin: boolean;
    onJoin: () => void;
    onPlayerPress?: (playerId: number) => void;
};

type TokenProps = {
    participant: Participant | null;
    isOrganizer: boolean;
    isYou: boolean;
    canJoin: boolean;
    onJoin: () => void;
    onPlayerPress?: (playerId: number) => void;
};

function PlayerToken({ participant, isOrganizer, isYou, canJoin, onJoin, onPlayerPress }: TokenProps) {
    if (!participant) {
        return (
            <Pressable
                onPress={onJoin}
                disabled={!canJoin}
                style={({ pressed }) => [styles.token, pressed && styles.pressed]}>
                <View style={styles.emptySlot}>
                    <ThemedText style={styles.emptyText}>{canJoin ? '+' : '?'}</ThemedText>
                </View>
                <ThemedText style={styles.name}>{canJoin ? 'Join' : 'Open'}</ThemedText>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={() => onPlayerPress?.(participant.id)}
            disabled={!onPlayerPress}
            accessibilityLabel={`Open profile of ${participant.username}`}
            style={({ pressed }) => [styles.token, pressed && styles.pressed]}>
            <View
                style={[
                    styles.avatar,
                    { backgroundColor: avatarColor(participant.username) },
                    isYou && styles.avatarYou,
                ]}>
                <ThemedText style={styles.initial}>{participant.username.charAt(0).toUpperCase()}</ThemedText>
                {isOrganizer && <ThemedText style={styles.crown}>👑</ThemedText>}
            </View>
            <ThemedText style={styles.name} numberOfLines={1}>
                {isYou ? 'YOU' : participant.username}
            </ThemedText>
        </Pressable>
    );
}

export function PlayerLineup({ match, currentUserId, canJoin, onJoin, onPlayerPress }: Props) {
    const capacity = Math.max(match.sport.numberOfPlayers, match.participants.length);
    const slots: (Participant | null)[] = Array.from(
        { length: capacity },
        (_, i) => match.participants.at(i) ?? null,
    );

    // играчите се делат наизменично на двете половини од теренот
    const halves = [slots.filter((_, i) => i % 2 === 0), slots.filter((_, i) => i % 2 === 1)];
    const isActive = match.status === 'OPEN' || match.status === 'FULL';
    const surface = SURFACES[match.sport.name.toLowerCase()] ?? '#4b5563';

    return (
        <View style={[styles.pitch, { backgroundColor: surface }, !isActive && styles.inactive]}>
            <View style={styles.centerLine} />
            <View style={styles.centerCircle} />

            {halves.map((half, halfIndex) => (
                <View key={halfIndex} style={styles.half}>
                    {half.map((participant, i) => (
                        <PlayerToken
                            key={participant?.id ?? `open-${halfIndex}-${i}`}
                            participant={participant}
                            isOrganizer={participant?.id === match.organizerId}
                            isYou={participant?.id === currentUserId}
                            canJoin={canJoin}
                            onJoin={onJoin}
                            onPlayerPress={onPlayerPress}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    pitch: {
        borderRadius: Spacing.three,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.55)',
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.three,
        gap: Spacing.five,
        overflow: 'hidden',
    },
    inactive: {
        opacity: 0.6,
    },
    centerLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    centerCircle: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 72,
        height: 72,
        marginTop: -35,
        marginLeft: -36,
        borderRadius: 36,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.55)',
    },
    half: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: Spacing.two,
    },
    token: {
        width: 68,
        alignItems: 'center',
        gap: Spacing.one,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    avatarYou: {
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    initial: {
        color: '#ffffff',
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 700,
    },
    crown: {
        position: 'absolute',
        top: -12,
        right: -6,
        fontSize: 16,
        lineHeight: 20,
    },
    emptySlot: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.75)',
    },
    emptyText: {
        color: '#ffffff',
        fontSize: 20,
        lineHeight: 24,
    },
    name: {
        color: '#ffffff',
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 600,
        maxWidth: 64,
    },
    pressed: {
        opacity: 0.7,
    },
});