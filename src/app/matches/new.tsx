import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createMatch, getSports, getVenues } from '@/api/client';
import type { Sport, Venue } from '@/api/types';
import { Chip } from '@/components/chip';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { formatTime, toLocalIsoString } from '@/utils/format';

// ПРИВРЕМЕНО додека нема auth: „најавениот“ играч (3 = ana)
const CURRENT_PLAYER_ID = 3;

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 – 22:00
const DURATIONS = [60, 90, 120];

function nextDays(count: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: count }, (_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        return day;
    });
}

function dayLabel(day: Date, index: number) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function NewMatchScreen() {
    const [sports, setSports] = useState<Sport[]>([]);
    const [sportId, setSportId] = useState<number | null>(null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [venueId, setVenueId] = useState<number | null>(null);
    const [loadingVenues, setLoadingVenues] = useState(false);
    const [dayIndex, setDayIndex] = useState(1); // default: утре
    const [hour, setHour] = useState(18);
    const [duration, setDuration] = useState(90);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const days = useMemo(() => nextDays(7), []);

    useEffect(() => {
        getSports().then(setSports).catch(() => setError('Could not load sports'));
    }, []);

    // кога ќе се смени спортот: ресетирај терен и вчитај ги само теретите за тој спорт
    useEffect(() => {
        setVenueId(null);
        if (!sportId) {
            setVenues([]);
            return;
        }
        setLoadingVenues(true);
        getVenues(sportId)
            .then(setVenues)
            .catch(() => setError('Could not load venues'))
            .finally(() => setLoadingVenues(false));
    }, [sportId]);

    // пресметани од изборите, не се посебен state
    const dateFrom = new Date(days[dayIndex]);
    dateFrom.setHours(hour, 0, 0, 0);
    const dateTo = new Date(dateFrom.getTime() + duration * 60_000);
    const isPast = dateFrom <= new Date();
    const canSubmit = sportId !== null && venueId !== null && !isPast && !submitting;

    async function onSubmit() {
        if (!sportId || !venueId) return;
        setSubmitting(true);
        setError(null);
        try {
            const created = await createMatch(CURRENT_PLAYER_ID, {
                sportId,
                venueId,
                dateFrom: toLocalIsoString(dateFrom),
                dateTo: toLocalIsoString(dateTo),
            });
            // replace: „Back“ од деталите води во листата, не назад во формата
            router.replace({ pathname: '/matches/[id]', params: { id: created.id } });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
            setSubmitting(false);
        }
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ThemedText type="subtitle">New match</ThemedText>

                    <Section title="1. Sport">
                        <SportFilter sports={sports} selectedId={sportId} onSelect={setSportId} showAll={false} />
                    </Section>

                    <Section title="2. Venue">
                        {!sportId ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                Pick a sport first.
                            </ThemedText>
                        ) : loadingVenues ? (
                            <ActivityIndicator />
                        ) : venues.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No venues for this sport yet.
                            </ThemedText>
                        ) : (
                            <View style={styles.wrap}>
                                {venues.map((venue) => (
                                    <Chip
                                        key={venue.id}
                                        label={venue.municipality ? `${venue.name} · ${venue.municipality}` : venue.name}
                                        selected={venueId === venue.id}
                                        onPress={() => setVenueId(venue.id)}
                                    />
                                ))}
                            </View>
                        )}
                    </Section>

                    <Section title="3. Day">
                        <View style={styles.wrap}>
                            {days.map((day, i) => (
                                <Chip
                                    key={day.toISOString()}
                                    label={dayLabel(day, i)}
                                    selected={dayIndex === i}
                                    onPress={() => setDayIndex(i)}
                                />
                            ))}
                        </View>
                    </Section>

                    <Section title="4. Start time">
                        <View style={styles.wrap}>
                            {HOURS.map((h) => (
                                <Chip
                                    key={h}
                                    label={`${String(h).padStart(2, '0')}:00`}
                                    selected={hour === h}
                                    onPress={() => setHour(h)}
                                />
                            ))}
                        </View>
                    </Section>

                    <Section title="5. Duration">
                        <View style={styles.wrap}>
                            {DURATIONS.map((d) => (
                                <Chip
                                    key={d}
                                    label={d % 60 === 0 ? `${d / 60}h` : `${Math.floor(d / 60)}h ${d % 60}min`}
                                    selected={duration === d}
                                    onPress={() => setDuration(d)}
                                />
                            ))}
                        </View>
                    </Section>

                    <ThemedView type="backgroundElement" style={styles.summary}>
                        <ThemedText type="small" themeColor="textSecondary">
                            {dayLabel(days[dayIndex], dayIndex)}, {formatTime(dateFrom.toISOString())} –{' '}
                            {formatTime(dateTo.toISOString())}
                        </ThemedText>
                        {isPast && (
                            <ThemedText type="small" style={styles.error}>
                                This time has already passed.
                            </ThemedText>
                        )}
                    </ThemedView>

                    {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                    <Pressable
                        onPress={onSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.button,
                            !canSubmit && styles.buttonDisabled,
                            pressed && styles.buttonPressed,
                        ]}>
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Create match</ThemedText>
                        )}
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <ThemedText type="smallBold">{title}</ThemedText>
            {children}
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
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    section: {
        gap: Spacing.two,
    },
    wrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    summary: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.one,
    },
    error: {
        color: '#e5484d',
    },
    button: {
        backgroundColor: '#3c87f7',
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
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