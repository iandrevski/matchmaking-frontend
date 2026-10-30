import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteVenue, getVenue, getVenueMatches } from '@/api/client';
import type { Match, Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { MatchCard } from '@/components/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { formatAddress } from '@/utils/format';
import { upcoming } from '@/utils/matches';
import { sportEmoji } from '@/utils/sports';

export default function VenueDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const venueId = Number(id);
    const { user } = useAuth();

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
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
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
        Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`,
        );
    }

    function createMatchHere() {
        if (!venue) return;
        router.push({
            pathname: '/matches/new',
            params: { venueId: venue.id, sportId: venue.sports[0]?.id },
        });
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
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/venues');
            }
        } catch (e) {
            setConfirmDelete(false);
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View>
                        <ThemedText type="subtitle">{venue.name}</ThemedText>
                        <ThemedText themeColor="textSecondary">📍 {formatAddress(venue)}</ThemedText>
                    </View>

                    <View style={styles.sports}>
                        {venue.sports.map((sport) => (
                            <ThemedView key={sport.id} type="backgroundElement" style={styles.pill}>
                                <ThemedText type="small">
                                    {sportEmoji(sport.name)} {sport.name}
                                </ThemedText>
                            </ThemedView>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        {!isPartner && (
                            <Pressable
                                onPress={createMatchHere}
                                style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.pressed]}>
                                <ThemedText style={styles.buttonText}>+ Create match here</ThemedText>
                            </Pressable>
                        )}
                        {isOwner && (
                            <Pressable
                                onPress={editVenue}
                                style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.pressed]}>
                                <ThemedText style={styles.buttonText}>Edit venue</ThemedText>
                            </Pressable>
                        )}
                        {isOwner && (
                            <Pressable
                                onPress={onDelete}
                                style={({ pressed }) => [styles.button, styles.buttonDanger, pressed && styles.pressed]}>
                                <ThemedText style={styles.buttonText}>
                                    {confirmDelete ? 'Tap again to delete' : 'Delete venue'}
                                </ThemedText>
                            </Pressable>
                        )}
                        {hasLocation && (
                            <Pressable
                                onPress={openInMaps}
                                style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                                <ThemedView type="backgroundElement" style={styles.buttonInner}>
                                    <ThemedText>🗺️ Open in Maps</ThemedText>
                                </ThemedView>
                            </Pressable>
                        )}
                    </View>

                    {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                    <View style={styles.section}>
                        <ThemedText type="smallBold">Upcoming matches</ThemedText>
                        {matches.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No upcoming matches here yet.
                            </ThemedText>
                        ) : (
                            matches.map((m) => <MatchCard key={m.id} match={m} linked={!isPartner} />)
                        )}
                    </View>
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
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    sports: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    pill: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Spacing.three,
    },
    actions: {
        gap: Spacing.two,
    },
    button: {
        borderRadius: Spacing.three,
        overflow: 'hidden',
    },
    buttonPrimary: {
        backgroundColor: '#3c87f7',
        paddingVertical: Spacing.three,
        alignItems: 'center',
    },
    buttonDanger: {
        backgroundColor: '#e5484d',
        paddingVertical: Spacing.three,
        alignItems: 'center',
    },
    buttonInner: {
        paddingVertical: Spacing.three,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
    },
    pressed: {
        opacity: 0.8,
    },
    section: {
        gap: Spacing.two,
    },
    error: {
        color: '#e5484d',
    },
});