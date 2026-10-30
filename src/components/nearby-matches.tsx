import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { getNearbyMatches, updateMyLocation } from '@/api/client';
import type { NearbyMatch } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { Chip } from '@/components/chip';
import { MatchCard } from '@/components/match-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const RADII = [5, 10, 25];

type Position = { lat: number; lng: number };

export function NearbyMatches() {
    const { user } = useAuth();
    const [position, setPosition] = useState<Position | null>(null);
    const [radius, setRadius] = useState(10);
    const [results, setResults] = useState<NearbyMatch[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function search({ lat, lng }: Position, radiusKm: number) {
        const found = await getNearbyMatches(lat, lng, radiusKm);
        // натпреварите каде што веќе си приклучен се во „My upcoming matches“
        setResults(found.filter((n) => !n.match.participantIds.includes(user?.id ?? -1)));
    }

    async function findNearby() {
        setLoading(true);
        setError(null);
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (!permission.granted) {
                setError('Allow location access to find matches near you.');
                return;
            }
            const { coords } = await Location.getCurrentPositionAsync({});
            const current = { lat: coords.latitude, lng: coords.longitude };
            setPosition(current);
            updateMyLocation(current.lat, current.lng).catch(() => {}); // не е критично за пребарувањето
            await search(current, radius);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not get your location');
        } finally {
            setLoading(false);
        }
    }

    async function changeRadius(km: number) {
        setRadius(km);
        if (!position) return;
        setLoading(true);
        setError(null);
        try {
            await search(position, km);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.section}>
            <ThemedText type="smallBold">Near you</ThemedText>

            <View style={styles.radii}>
                {RADII.map((km) => (
                    <Chip key={km} label={`${km} km`} selected={radius === km} onPress={() => changeRadius(km)} />
                ))}
            </View>

            <Pressable
                onPress={findNearby}
                disabled={loading}
                style={({ pressed }) => [styles.button, loading && styles.disabled, pressed && styles.pressed]}>
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <ThemedText style={styles.buttonText}>📍 Find matches near me</ThemedText>
                )}
            </Pressable>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            {results?.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                    No open matches within {radius} km.
                </ThemedText>
            )}

            {results?.map(({ match, distanceKm }) => (
                <View key={match.id} style={styles.result}>
                    <ThemedText type="small" themeColor="textSecondary">
                        {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away
                    </ThemedText>
                    <MatchCard match={match} />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.two,
    },
    radii: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    button: {
        backgroundColor: '#30a46c',
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.8,
    },
    result: {
        gap: Spacing.one,
    },
    error: {
        color: '#e5484d',
    },
});