import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getMatchDays } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, addMonths, monthDays, toIsoDate, weekDays } from '@/utils/calendar';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENT = '#3c87f7';

type Props = {
    selectedDate: string | null;
    onSelect: (date: string | null) => void;
    sportId?: number | null;
    venueId?: number | null;
    clearable?: boolean; // false: секогаш има избран ден (за распоред на терен)
};

export function MiniCalendar({ selectedDate, onSelect, sportId = null, venueId = null, clearable = true}: Props) {
    const theme = useTheme();
    const [anchor, setAnchor] = useState(() => new Date());
    const [expanded, setExpanded] = useState(false);
    const [matchDays, setMatchDays] = useState<string[]>([]);

    const days = expanded ? monthDays(anchor) : weekDays(anchor);
    const from = toIsoDate(days[0]);
    const to = toIsoDate(days[days.length - 1]);
    const today = toIsoDate(new Date());

    // точките секогаш важат за прикажаниот период и избраниот спорт
    useEffect(() => {
        getMatchDays(from, to, sportId, venueId).then(setMatchDays).catch(() => setMatchDays([]));
    }, [from, to, sportId, venueId]);

    function move(direction: number) {
        setAnchor(expanded ? addMonths(anchor, direction) : addDays(anchor, direction * 7));
    }

    function goToToday() {
        setAnchor(new Date());
        onSelect(today);
    }

    const title = anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    return (
        <ThemedView type="backgroundElement" style={styles.calendar}>
            <View style={styles.header}>
                <Pressable onPress={() => setExpanded(!expanded)} style={styles.titleButton}>
                    <ThemedText type="smallBold">{title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        {expanded ? '▴' : '▾'}
                    </ThemedText>
                </Pressable>

                <View style={styles.actions}>
                    {selectedDate && clearable ? (
                        <Pressable onPress={() => onSelect(null)} style={styles.textButton}>
                            <ThemedText type="small" style={styles.accentText}>
                                All dates
                            </ThemedText>
                        </Pressable>
                    ) : (
                        <Pressable onPress={goToToday} style={styles.textButton}>
                            <ThemedText type="small" style={styles.accentText}>
                                Today
                            </ThemedText>
                        </Pressable>
                    )}
                    <Pressable onPress={() => move(-1)} style={styles.arrow}>
                        <ThemedText>‹</ThemedText>
                    </Pressable>
                    <Pressable onPress={() => move(1)} style={styles.arrow}>
                        <ThemedText>›</ThemedText>
                    </Pressable>
                </View>
            </View>

            <View style={styles.grid}>
                {WEEKDAYS.map((name) => (
                    <View key={name} style={styles.cell}>
                        <ThemedText style={[styles.weekday, { color: theme.textSecondary }]}>{name}</ThemedText>
                    </View>
                ))}

                {days.map((day) => {
                    const iso = toIsoDate(day);
                    const isSelected = iso === selectedDate;
                    const isToday = iso === today;
                    const isOutside = expanded && day.getMonth() !== anchor.getMonth();
                    const hasMatches = matchDays.includes(iso);

                    return (
                        <Pressable
                            key={iso}
                            onPress={() => onSelect(isSelected ? null : iso)}
                            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
                            <View
                                style={[
                                    styles.day,
                                    isToday && styles.today,
                                    isSelected && styles.selected,
                                    isOutside && styles.outside,
                                ]}>
                                <ThemedText style={[styles.dayText, isSelected && styles.selectedText]}>
                                    {day.getDate()}
                                </ThemedText>
                            </View>
                            <View style={[styles.dot, hasMatches && styles.dotVisible]} />
                        </Pressable>
                    );
                })}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    calendar: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    textButton: {
        paddingHorizontal: Spacing.two,
    },
    accentText: {
        color: ACCENT,
    },
    arrow: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: '14.28%',
        alignItems: 'center',
        paddingVertical: Spacing.half,
    },
    weekday: {
        fontSize: 11,
        lineHeight: 16,
        fontWeight: 600,
    },
    day: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    today: {
        borderColor: ACCENT,
    },
    selected: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    outside: {
        opacity: 0.35,
    },
    dayText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: 600,
    },
    selectedText: {
        color: '#ffffff',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 2,
        backgroundColor: 'transparent',
    },
    dotVisible: {
        backgroundColor: ACCENT,
    },
    pressed: {
        opacity: 0.7,
    },
});