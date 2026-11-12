import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getVenueStats } from '@/api/client';
import type { CountItem, VenueStats } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sportEmoji } from '@/utils/sports';
import { SectionTitle } from '@/components/ui/section-title';

const ACCENT = Brand.primary;
const CHART_HEIGHT = 96;

export function VenueStatsPanel({ venueId }: { venueId: number }) {
    const [stats, setStats] = useState<VenueStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getVenueStats(venueId)
            .then(setStats)
            .catch((e) => setError(e instanceof Error ? e.message : 'Could not load stats'));
    }, [venueId]);

    if (error) {
        return <ThemedText style={styles.error}>{error}</ThemedText>;
    }
    if (!stats) {
        return <ActivityIndicator />;
    }

    return (
        <View style={styles.section}>
            <SectionTitle>Insights</SectionTitle>

            {stats.totalMatches === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                    No matches here yet. Stats appear after the first booking.
                </ThemedText>
            ) : (
                <>
                    <View style={styles.kpis}>
                        <Kpi
                            label="Matches"
                            value={String(stats.totalMatches)}
                            detail={`${stats.upcomingMatches} upcoming · ${stats.finishedMatches} played`}
                        />
                        <Kpi
                            label="Players"
                            value={String(stats.totalPlayers)}
                            detail={`${stats.uniquePlayers} different`}
                        />
                        <Kpi
                            label="Fill rate"
                            value={`${stats.fillRatePercent}%`}
                            detail="of available spots"
                            progress={stats.fillRatePercent}
                        />
                        <Kpi
                            label="Booked value"
                            value={stats.bookedValue === null ? `${stats.bookedHours} h` : `${stats.bookedValue} MKD`}
                            detail={stats.bookedValue === null ? 'set a price to see value' : `${stats.bookedHours} hours booked`}
                        />
                    </View>

                    <ChartCard title="Popular start times" items={stats.byHour} labelEvery={2} />
                    <ChartCard title="Busiest days" items={stats.byWeekday} labelEvery={1} />

                    <ThemedView type="backgroundElement" style={styles.card}>
                        <ThemedText type="smallBold">By sport</ThemedText>
                        {stats.bySport.map((item) => (
                            <SportBar key={item.label} item={item} max={stats.bySport[0].count} />
                        ))}
                    </ThemedView>

                    {stats.cancelledMatches > 0 && (
                        <ThemedText type="small" themeColor="textSecondary">
                            {stats.cancelledMatches} cancelled {stats.cancelledMatches === 1 ? 'match is' : 'matches are'} not
                            counted.
                        </ThemedText>
                    )}
                </>
            )}
        </View>
    );
}

function Kpi({ label, value, detail, progress }: { label: string; value: string; detail: string; progress?: number }) {
    const theme = useTheme();
    return (
        <ThemedView type="backgroundElement" style={styles.kpi}>
            <ThemedText type="small" themeColor="textSecondary">
                {label}
            </ThemedText>
            <ThemedText style={styles.kpiValue}>{value}</ThemedText>
            {progress !== undefined && (
                <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.trackFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
            )}
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {detail}
            </ThemedText>
        </ThemedView>
    );
}

// вертикални столбови; најголемиот е истакнат и има број над себе
function ChartCard({ title, items, labelEvery }: { title: string; items: CountItem[]; labelEvery: number }) {
    const theme = useTheme();
    const max = Math.max(1, ...items.map((i) => i.count));
    const peak = items.reduce((best, item) => (item.count > best.count ? item : best), items[0]);

    return (
        <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.chartHeader}>
                <ThemedText type="smallBold">{title}</ThemedText>
                {peak.count > 0 && (
                    <ThemedText type="small" themeColor="tint" style={styles.accentText}>
                        Peak: {peak.label}
                    </ThemedText>
                )}
            </View>

            <View style={styles.columns}>
                {items.map((item, i) => {
                    const isPeak = item === peak && item.count > 0;
                    return (
                        <View key={item.label} style={styles.column}>
                            <ThemedText themeColor="tint" style={[styles.columnValue, !isPeak && styles.hidden]}>{item.count}</ThemedText>
                            <View style={styles.columnArea}>
                                <View
                                    style={[
                                        styles.columnBar,
                                        {
                                            height: Math.max(3, (item.count / max) * CHART_HEIGHT),
                                            backgroundColor: isPeak ? ACCENT : theme.backgroundSelected,
                                        },
                                    ]}
                                />
                            </View>
                            <ThemedText style={[styles.columnLabel, { color: theme.textSecondary }]}>
                                {i % labelEvery === 0 ? item.label : ' '}
                            </ThemedText>
                        </View>
                    );
                })}
            </View>
        </ThemedView>
    );
}

function SportBar({ item, max }: { item: CountItem; max: number }) {
    const theme = useTheme();
    return (
        <View style={styles.sportRow}>
            <ThemedText type="small" style={styles.sportName} numberOfLines={1}>
                {sportEmoji(item.label)} {item.label}
            </ThemedText>
            <View style={[styles.track, styles.sportTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.trackFill, { width: `${(item.count / max) * 100}%` }]} />
            </View>
            <ThemedText type="smallBold" style={styles.sportCount}>
                {item.count}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.two,
    },
    error: {
        color: '#e5484d',
    },
    kpis: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    kpi: {
        flexGrow: 1,
        flexBasis: '45%',
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.half,
    },
    kpiValue: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: 700,
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    trackFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: ACCENT,
    },
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    accentText: {
        fontWeight: 600,
    },
    columns: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    column: {
        flex: 1,
        alignItems: 'center',
    },
    columnValue: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: 700,
    },
    hidden: {
        opacity: 0,
    },
    columnArea: {
        height: CHART_HEIGHT,
        width: '100%',
        justifyContent: 'flex-end',
    },
    columnBar: {
        width: '100%',
        borderRadius: 4,
    },
    columnLabel: {
        fontSize: 10,
        lineHeight: 14,
        marginTop: 4,
    },
    sportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    sportName: {
        width: 110,
    },
    sportTrack: {
        flex: 1,
        height: 10,
        borderRadius: 5,
    },
    sportCount: {
        width: 24,
        textAlign: 'right',
    },
});