import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createMatch, getSports, getVenues } from '@/api/client';
import type { Sport, Venue } from '@/api/types';
import { Chip } from '@/components/chip';
import { SportFilter } from '@/components/sport-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ListSkeleton } from '@/components/ui/skeleton';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useToast } from '@/feedback/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice, formatTime, toLocalIsoString } from '@/utils/format';
import { haptic } from '@/utils/haptics';

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

function durationLabel(minutes: number) {
    return minutes % 60 === 0 ? `${minutes / 60}h` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function NewMatchScreen() {
    // од Venue: ?sportId=1&venueId=2, од распоредот и &date=2026-11-05&hour=20
    const params = useLocalSearchParams<{ sportId?: string; venueId?: string; date?: string; hour?: string }>();
    const theme = useTheme();
    const toast = useToast();

    const [sports, setSports] = useState<Sport[]>([]);
    const [sportId, setSportId] = useState<number | null>(params.sportId ? Number(params.sportId) : null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [venueId, setVenueId] = useState<number | null>(null);
    const [loadingVenues, setLoadingVenues] = useState(false);
    const [dayIndex, setDayIndex] = useState(() => {
        if (!params.date) return 1; // default: утре
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.round((new Date(`${params.date}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
        // формата нуди само 7 дена; подоцнежен датум → утре
        return diff >= 0 && diff < 7 ? diff : 1;
    });
    const [hour, setHour] = useState(() => {
        const fromParams = Number(params.hour);
        return HOURS.includes(fromParams) ? fromParams : 18;
    });
    const [duration, setDuration] = useState(90);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const days = useMemo(() => nextDays(7), []);

    useEffect(() => {
        getSports().then(setSports).catch(() => setError('Could not load sports'));
    }, []);

    // кога ќе се смени спортот: ресетирај терен и вчитај ги само тие за тој спорт
    useEffect(() => {
        setVenueId(null);
        if (!sportId) {
            setVenues([]);
            return;
        }
        setLoadingVenues(true);
        getVenues(sportId)
            .then((list) => {
                setVenues(list);
                // ако дошле од Venue и тој терен го има овој спорт → избери го
                const wanted = Number(params.venueId);
                if (wanted && list.some((v) => v.id === wanted)) {
                    setVenueId(wanted);
                }
            })
            .catch(() => setError('Could not load venues'))
            .finally(() => setLoadingVenues(false));
    }, [sportId, params.venueId]);

    // пресметани од изборите, не се посебен state
    const dateFrom = new Date(days[dayIndex]);
    dateFrom.setHours(hour, 0, 0, 0);
    const dateTo = new Date(dateFrom.getTime() + duration * 60_000);
    const isPast = dateFrom <= new Date();
    const canSubmit = sportId !== null && venueId !== null && !isPast && !submitting;
    const venue = venues.find((v) => v.id === venueId);

    async function onSubmit() {
        if (!sportId || !venueId) return;
        setSubmitting(true);
        setError(null);
        try {
            // организаторот е најавениот корисник, backend-от го зема од токенот
            const created = await createMatch({
                sportId,
                venueId,
                dateFrom: toLocalIsoString(dateFrom),
                dateTo: toLocalIsoString(dateTo),
            });
            haptic.success();
            toast('Match created! Now invite your friends 🎉');
            // replace: „Back“ од деталите води во листата, не назад во формата
            router.replace({ pathname: '/matches/[id]', params: { id: created.id } });
        } catch (e) {
            haptic.error();
            setError(e instanceof Error ? e.message : 'Something went wrong');
            setSubmitting(false);
        }
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader title="New match" subtitle="Set it up in a few taps" fallback="/matches" />

                    <Step number={1} title="Sport" done={sportId !== null}>
                        <SportFilter sports={sports} selectedId={sportId} onSelect={setSportId} showAll={false} />
                    </Step>

                    <Step number={2} title="Venue" done={venueId !== null}>
                        {!sportId ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                Pick a sport first.
                            </ThemedText>
                        ) : loadingVenues ? (
                            <ListSkeleton rows={2} />
                        ) : venues.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No venues for this sport yet.
                            </ThemedText>
                        ) : (
                            <View style={styles.venues}>
                                {venues.map((v) => {
                                    const selected = venueId === v.id;
                                    return (
                                        <Pressable
                                            key={v.id}
                                            onPress={() => {
                                                haptic.tap();
                                                setVenueId(v.id);
                                            }}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected }}
                                            style={({ pressed }) => [
                                                styles.venue,
                                                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                                                selected && { borderColor: Brand.primary, backgroundColor: theme.tintSoft },
                                                pressed && styles.pressed,
                                            ]}>
                                            <View style={[styles.radio, { borderColor: selected ? Brand.primary : theme.border }]}>
                                                {selected && <View style={styles.radioDot} />}
                                            </View>
                                            <View style={styles.flex}>
                                                <ThemedText type="smallBold" numberOfLines={1}>
                                                    {v.name}
                                                </ThemedText>
                                                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                                                    {[v.municipality, formatPrice(v.pricePerHour)].filter(Boolean).join(' · ')}
                                                </ThemedText>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </Step>

                    <Step number={3} title="Day" done>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
                            {days.map((day, i) => {
                                const selected = dayIndex === i;
                                return (
                                    <Pressable
                                        key={day.toISOString()}
                                        onPress={() => {
                                            haptic.tap();
                                            setDayIndex(i);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={dayLabel(day, i)}
                                        accessibilityState={{ selected }}
                                        style={({ pressed }) => [
                                            styles.day,
                                            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                                            selected && styles.daySelected,
                                            pressed && styles.pressed,
                                        ]}>
                                        <ThemedText
                                            style={[styles.dayName, { color: selected ? Brand.onDarkMuted : theme.textSecondary }]}>
                                            {i === 0 ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short' })}
                                        </ThemedText>
                                        <ThemedText style={[styles.dayNumber, selected && { color: Brand.onPrimary }]}>
                                            {day.getDate()}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Step>

                    <Step number={4} title="Start time" done>
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
                    </Step>

                    <Step number={5} title="Duration" done>
                        <View style={[styles.segment, { backgroundColor: theme.background }]}>
                            {DURATIONS.map((d) => {
                                const selected = duration === d;
                                return (
                                    <Pressable
                                        key={d}
                                        onPress={() => {
                                            haptic.tap();
                                            setDuration(d);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected }}
                                        style={[styles.segmentItem, selected && styles.segmentSelected]}>
                                        <ThemedText
                                            style={[styles.segmentText, selected && { color: Brand.onPrimary }]}>
                                            {durationLabel(d)}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Step>
                </ScrollView>

                {/* преглед и копче: секогаш долу */}
                <View style={[styles.footer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
                    {(error || isPast) && (
                        <ThemedText type="small" style={styles.error} numberOfLines={2}>
                            {error ?? 'This time has already passed. Pick a later one.'}
                        </ThemedText>
                    )}
                    <View style={styles.footerRow}>
                        <View style={styles.flex}>
                            <ThemedText style={styles.footerTitle} numberOfLines={1}>
                                {dayLabel(days[dayIndex], dayIndex)} · {formatTime(dateFrom.toISOString())}–
                                {formatTime(dateTo.toISOString())}
                            </ThemedText>
                            <View style={styles.footerVenue}>
                                <Icon name="map-pin" size={13} tone="textSecondary" />
                                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
                                    {venue ? venue.name : 'Pick a venue'}
                                </ThemedText>
                            </View>
                        </View>
                        <PillButton label="Create" icon="check" loading={submitting} disabled={!canSubmit} onPress={onSubmit} style={styles.footerButton} />
                    </View>
                </View>
            </SafeAreaView>
        </ThemedView>
    );
}

// еден чекор од формата: број во круг + наслов + содржина во картичка
function Step({ number, title, done, children }: { number: number; title: string; done: boolean; children: React.ReactNode }) {
    const theme = useTheme();
    return (
        <Card style={styles.step}>
            <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, { backgroundColor: done ? Brand.primary : theme.backgroundSelected }]}>
                    {done ? (
                        <Icon name="check" size={14} color={Brand.onPrimary} />
                    ) : (
                        <ThemedText style={styles.stepNumberText}>{number}</ThemedText>
                    )}
                </View>
                <ThemedText style={styles.stepTitle}>{title}</ThemedText>
            </View>
            {children}
        </Card>
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
        gap: Spacing.three,
    },
    flex: {
        flex: 1,
    },
    pressed: {
        opacity: 0.8,
    },
    step: {
        gap: Spacing.three,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: 800,
    },
    stepTitle: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: 800,
    },
    venues: {
        gap: Spacing.two,
    },
    venue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1.5,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Brand.primary,
    },
    days: {
        gap: Spacing.two,
    },
    day: {
        width: 64,
        height: 72,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    daySelected: {
        backgroundColor: Brand.primary,
        borderColor: Brand.primary,
    },
    dayName: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 700,
    },
    dayNumber: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: 800,
    },
    wrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    segment: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: Radius.pill,
        gap: 4,
    },
    segmentItem: {
        flex: 1,
        height: 42,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentSelected: {
        backgroundColor: Brand.primary,
    },
    segmentText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: 800,
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
        fontSize: 17,
        lineHeight: 24,
        fontWeight: 800,
    },
    footerVenue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    footerButton: {
        minWidth: 120,
    },
    error: {
        color: Brand.danger,
    },
});
