import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getMatches } from '@/api/client';
import type { Match, Venue } from '@/api/types';
import { DaySchedule } from '@/components/day-schedule';
import { MiniCalendar } from '@/components/mini-calendar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { toIsoDate } from '@/utils/calendar';

type Props = {
    venue: Venue;
    canBook: boolean;
};

export function VenueAvailability({ venue, canBook }: Props) {
    const [date, setDate] = useState(() => toIsoDate(new Date()));
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMatches({ venueId: venue.id, date })
            .then((list) => setMatches(list.filter((m) => m.status !== 'CANCELLED')))
            .catch(() => setMatches([]))
            .finally(() => setLoading(false));
    }, [venue.id, date]);

    function book(hour: number) {
        router.push({
            pathname: '/matches/new',
            params: { venueId: venue.id, sportId: venue.sports[0]?.id, date, hour },
        });
    }

    return (
        <View style={styles.section}>
            <ThemedText type="smallBold">Availability</ThemedText>
            <MiniCalendar
                selectedDate={date}
                onSelect={(selected) => selected && setDate(selected)}
                venueId={venue.id}
                clearable={false}
            />
            {loading ? (
                <ActivityIndicator />
            ) : (
                <DaySchedule date={date} matches={matches} onPickHour={canBook ? book : undefined} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.two,
    },
});