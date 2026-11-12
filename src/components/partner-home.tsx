import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyVenues } from '@/api/client';
import type { Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SportIcon } from '@/components/ui/icon';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { PillButton } from '@/components/ui/pill-button';
import { SectionTitle } from '@/components/ui/section-title';
import { VenueCardSkeleton } from '@/components/ui/skeleton';
import { VenueCard } from '@/components/venue-card';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// поздрав според времето од денот
function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Home за сопственик на терени
export function PartnerHome() {
    const { user, logout } = useAuth();
    const theme = useTheme();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            setError(null);
            setVenues(await getMyVenues(user.id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            load().finally(() => setLoading(false));
        }, [load]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    // колку различни спортови се нудат низ сите терени
    const sportCount = new Set(venues.flatMap((v) => v.sports.map((s) => s.id))).size;
    const withPhotos = venues.filter((v) => v.photoUrls.length > 0).length;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}>
                    {/* hero: поздрав, бројки и главна акција */}
                    <Card variant="dark" style={styles.hero}>
                        <View style={styles.brandRow}>
                            <SportIcon sport="football" size={20} color={Brand.accent} />
                            <ThemedText style={styles.brand}>Sportify for venues</ThemedText>
                        </View>

                        <View>
                            <ThemedText style={styles.hello}>{greeting()},</ThemedText>
                            <ThemedText style={styles.name} numberOfLines={1}>
                                {user?.username}
                            </ThemedText>
                        </View>

                        <View style={[styles.stats, { borderTopColor: Brand.onDarkFaint }]}>
                            <Stat value={venues.length} label={venues.length === 1 ? 'Venue' : 'Venues'} />
                            <View style={styles.divider} />
                            <Stat value={sportCount} label={sportCount === 1 ? 'Sport' : 'Sports'} />
                            <View style={styles.divider} />
                            <Stat value={withPhotos} label="With photos" />
                        </View>

                        <PillButton label="Add a venue" icon="plus" variant="accent" onPress={() => router.push('/venues/new')} />
                    </Card>

                    {error && (
                        <ThemedText type="small" style={styles.error}>
                            {error}
                        </ThemedText>
                    )}

                    <View style={styles.section}>
                        <SectionTitle>Your venues</SectionTitle>
                        {loading ? (
                            <VenueCardSkeleton />
                        ) : venues.length === 0 ? (
                            <EmptyState
                                icon="map-pin"
                                title="No venues yet"
                                text="Add your first venue so players can find it and book matches.">
                                <PillButton label="Add a venue" icon="plus" size="sm" variant="soft" onPress={() => router.push('/venues/new')} />
                            </EmptyState>
                        ) : (
                            venues.map((v) => <VenueCard key={v.id} venue={v} />)
                        )}
                    </View>

                    {/* совет: слики носат повеќе резервации */}
                    {!loading && venues.length > 0 && withPhotos < venues.length && (
                        <Card style={styles.tip}>
                            <ThemedText type="smallBold">Tip: add photos</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                                Venues with photos get noticed first. Open a venue and tap “Add photo”.
                            </ThemedText>
                        </Card>
                    )}

                    <ListGroup label="Account">
                        <ListRow icon="log-out" title="Log out" danger onPress={logout} />
                    </ListGroup>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Stat({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.stat}>
            <ThemedText style={styles.statValue}>{value}</ThemedText>
            <ThemedText style={styles.statLabel}>{label}</ThemedText>
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
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    hero: {
        gap: Spacing.four,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    brand: {
        color: Brand.onDark,
        fontWeight: 800,
    },
    hello: {
        color: Brand.onDarkMuted,
        fontSize: 18,
        lineHeight: 24,
    },
    name: {
        color: Brand.onDark,
        fontSize: 34,
        lineHeight: 42,
        fontWeight: 800,
        letterSpacing: -0.5,
    },
    stats: {
        flexDirection: 'row',
        paddingTop: Spacing.three,
        borderTopWidth: 1,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: Brand.onDark,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: 800,
    },
    statLabel: {
        color: Brand.onDarkMuted,
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        width: 1,
        backgroundColor: Brand.onDarkFaint,
    },
    section: {
        gap: Spacing.three,
    },
    tip: {
        gap: Spacing.one,
    },
    error: {
        color: Brand.danger,
    },
});
