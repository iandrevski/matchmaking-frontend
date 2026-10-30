import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { getVenue, updateVenue } from '@/api/client';
import type { Venue } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VenueForm } from '@/components/venue-form';

export default function EditVenueScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const venueId = Number(id);

    const [venue, setVenue] = useState<Venue | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getVenue(venueId)
            .then(setVenue)
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'));
    }, [venueId]);

    if (!venue) {
        return (
            <ThemedView style={styles.centered}>
                {error ? <ThemedText style={styles.error}>{error}</ThemedText> : <ActivityIndicator size="large" />}
            </ThemedView>
        );
    }

    return (
        <VenueForm
            title="Edit venue"
            submitLabel="Save changes"
            initial={venue}
            onSubmit={async (body) => {
                await updateVenue(venueId, body);
                router.back();
            }}
        />
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: '#e5484d',
    },
});