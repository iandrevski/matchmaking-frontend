import { Pressable, StyleSheet, View } from 'react-native';

import type { Match } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { formatTime } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 – 22:00

type Props = {
    date: string; // "2026-11-05"
    matches: Match[];
    onPickHour?: (hour: number) => void; // undefined = само преглед (партнер)
};

function slot(date: string, hour: number) {
    const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
    return { start, end: new Date(start.getTime() + 60 * 60_000) };
}

export function DaySchedule({ date, matches, onPickHour }: Props) {
    const now = new Date();

    return (
        <View style={styles.list}>
            {HOURS.map((hour) => {
                const { start, end } = slot(date, hour);
                // натпревар што се преклопува со овој час
                const match = matches.find((m) => new Date(m.dateFrom) < end && new Date(m.dateTo) > start);
                const isPast = end <= now;
                const startsHere = match && new Date(match.dateFrom) >= start;

                return (
                    <View key={hour} style={styles.row}>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
                            {String(hour).padStart(2, '0')}:00
                        </ThemedText>

                        {match ? (
                            <View style={[styles.slot, styles.booked, !startsHere && styles.continued]}>
                                {startsHere && (
                                    <ThemedText type="small" style={styles.bookedText}>
                                        {sportEmoji(match.sport.name)} {formatTime(match.dateFrom)}–{formatTime(match.dateTo)} ·{' '}
                                        {match.participantsCount}/{match.sport.numberOfPlayers}
                                    </ThemedText>
                                )}
                            </View>
                        ) : isPast ? (
                            <ThemedView type="backgroundElement" style={[styles.slot, styles.past]} />
                        ) : onPickHour ? (
                            <Pressable
                                onPress={() => onPickHour(hour)}
                                style={({ pressed }) => [styles.slot, styles.free, pressed && styles.pressed]}>
                                <ThemedText type="small" style={styles.freeText}>
                                    Free · tap to book
                                </ThemedText>
                            </Pressable>
                        ) : (
                            <View style={[styles.slot, styles.free]}>
                                <ThemedText type="small" style={styles.freeText}>
                                    Free
                                </ThemedText>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: Spacing.one,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    time: {
        width: 44,
    },
    slot: {
        flex: 1,
        minHeight: 32,
        borderRadius: Spacing.two,
        justifyContent: 'center',
        paddingHorizontal: Spacing.three,
    },
    booked: {
        backgroundColor: 'rgba(229,72,77,0.18)',
        borderLeftWidth: 4,
        borderLeftColor: '#e5484d',
    },
    continued: {
        minHeight: 32,
    },
    bookedText: {
        color: '#e5484d',
        fontWeight: 600,
    },
    free: {
        backgroundColor: 'rgba(46,139,87,0.12)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Brand.success,
    },
    freeText: {
        color: Brand.success,
    },
    past: {
        opacity: 0.4,
    },
    pressed: {
        opacity: 0.7,
    },
});