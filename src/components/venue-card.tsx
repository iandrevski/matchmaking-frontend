import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Venue } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatAddress } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

export function VenueCard({ venue }: { venue: Venue }) {
    return (
        <Link href={{ pathname: '/venues/[id]', params: { id: venue.id } }} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText type="smallBold">{venue.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        📍 {formatAddress(venue)}
                    </ThemedText>
                    <View style={styles.sports}>
                        {venue.sports.map((sport) => (
                            <ThemedView key={sport.id} type="backgroundSelected" style={styles.pill}>
                                <ThemedText type="small">
                                    {sportEmoji(sport.name)} {sport.name}
                                </ThemedText>
                            </ThemedView>
                        ))}
                    </View>
                </ThemedView>
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    pressed: {
        opacity: 0.7,
    },
    sports: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    pill: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.half,
        borderRadius: Spacing.three,
    },
});