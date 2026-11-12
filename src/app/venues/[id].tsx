import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteVenue, getVenue, getVenueMatches } from '@/api/client';
import type { Match, Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { FavoriteButton } from '@/components/favorite-button';
import { MatchCard } from '@/components/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, SportIcon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionTitle } from '@/components/ui/section-title';
import { ScreenSkeleton } from '@/components/ui/skeleton';
import { VenueAvailability } from '@/components/venue-availability';
import { VenueGallery } from '@/components/venue-gallery';
import { VenueReviews } from '@/components/venue-reviews';
import { VenueStatsPanel } from '@/components/venue-stats-panel';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { useToast } from '@/feedback/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { formatAddress, formatPrice } from '@/utils/format';
import { upcoming } from '@/utils/matches';

export default function VenueDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const venueId = Number(id);
    const theme = useTheme();
    const toast = useToast();
    const { user } = useAuth();
    const { isFavoriteVenue, toggleVenue } = useFavorites();

    const [venue, setVenue] = useState<Venue | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // useFocusEffect: податоците се освежуваат по враќање од формата
    useFocusEffect(
        useCallback(() => {
            Promise.all([getVenue(venueId), getVenueMatches(venueId)])
                .then(([v, m]) => {
                    setVenue(v);
                    setMatches(upcoming(m));
                })
                .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
                .finally(() => setLoading(false));
        }, [venueId]),
    );

    if (loading) {
        return <ScreenSkeleton />;
    }

    if (!venue) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={styles.error}>{error ?? 'Venue not found'}</ThemedText>
            </ThemedView>
        );
    }

    const isPartner = user?.role === 'ROLE_OWNER';
    const isOwner = user?.id === venue.ownerId;
    const hasLocation = venue.latitude !== null && venue.longitude !== null;

    function openInMaps() {
        if (!venue) return;
        // Google Maps линк: работи на web, Android и iOS
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`);
    }

    function createMatchHere() {
        if (!venue) return;
        router.push({ pathname: '/matches/new', params: { venueId: venue.id, sportId: venue.sports[0]?.id } });
    }

    function editVenue() {
        router.push({ pathname: '/venues/edit/[id]', params: { id: venueId } });
    }

    // прв клик бара потврда, втор брише
    async function onDelete() {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        try {
            await deleteVenue(venueId);
            toast('Venue deleted');
            if (router.canGoBack()) router.back();
            else router.replace('/venues');
        } catch (e) {
            setConfirmDelete(false);
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader
                        fallback="/venues"
                        right={
                            !isPartner && (
                                <FavoriteButton active={isFavoriteVenue(venue.id)} onToggle={() => toggleVenue(venue.id)} />
                            )
                        }
                    />

                    <VenueGallery venue={venue} canEdit={isOwner} onChange={setVenue} />

                    {/* име, адреса, цена, спортови */}
                    <View style={styles.info}>
                        <ThemedText type="subtitle">{venue.name}</ThemedText>
                        <View style={styles.addressRow}>
                            <Icon name="map-pin" size={16} tone="textSecondary" />
                            <ThemedText themeColor="textSecondary" style={styles.flex}>
                                {formatAddress(venue)}
                            </ThemedText>
                        </View>
                        <View style={styles.pills}>
                            <View style={[styles.pill, { backgroundColor: theme.tintSoft }]}>
                                <Icon name="tag" size={14} tone="tint" />
                                <ThemedText style={[styles.pillText, { color: theme.tint }]}>
                                    {formatPrice(venue.pricePerHour)}
                                </ThemedText>
                            </View>
                            {venue.sports.map((sport) => (
                                <View key={sport.id} style={[styles.pill, styles.pillOutline, { borderColor: theme.border }]}>
                                    <SportIcon sport={sport.name} size={15} color={theme.tint} />
                                    <ThemedText style={styles.pillText}>{sport.name}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* акции */}
                    <View style={styles.actions}>
                        {!isPartner && <PillButton label="Create match here" icon="plus" onPress={createMatchHere} />}
                        {hasLocation && <PillButton label="Open in Maps" icon="navigation" variant="soft" onPress={openInMaps} />}
                        {isOwner && <PillButton label="Edit venue" icon="edit-2" variant="outline" onPress={editVenue} />}
                        {isOwner && (
                            <Pressable onPress={onDelete} style={styles.delete} hitSlop={8}>
                                <ThemedText type="smallBold" style={styles.deleteText}>
                                    {confirmDelete ? 'Tap again to delete this venue' : 'Delete venue'}
                                </ThemedText>
                            </Pressable>
                        )}
                    </View>

                    {error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

                    {isOwner && <VenueStatsPanel venueId={venue.id} />}
                    <VenueAvailability venue={venue} canBook={!isPartner} />

                    <View style={styles.section}>
                        <SectionTitle>Upcoming matches</SectionTitle>
                        {matches.length === 0 ? (
                            <EmptyState
                                icon="calendar"
                                title="No upcoming matches here"
                                text={isPartner ? undefined : 'Be the first to book a slot.'}
                            />
                        ) : (
                            matches.map((m) => <MatchCard key={m.id} match={m} linked={!isPartner} />)
                        )}
                    </View>

                    <VenueReviews venueId={venue.id} />
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    flex: {
        flex: 1,
    },
    info: {
        gap: Spacing.two,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    pills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
        marginTop: Spacing.one,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        height: 32,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.pill,
    },
    pillOutline: {
        borderWidth: 1,
    },
    pillText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: 700,
    },
    actions: {
        gap: Spacing.two,
    },
    delete: {
        alignSelf: 'center',
        paddingVertical: Spacing.two,
    },
    deleteText: {
        color: Brand.danger,
    },
    section: {
        gap: Spacing.three,
    },
    error: {
        color: Brand.danger,
    },
});
