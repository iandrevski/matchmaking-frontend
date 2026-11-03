import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { photoUrl } from '@/api/client';
import type { Venue } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatAddress, formatPrice } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

export function VenueCard({ venue }: { venue: Venue }) {
    return (
        <Link href={{ pathname: '/venues/[id]', params: { id: venue.id } }} asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.card}>
                    {/* насловна: првата прикачена слика */}
                    {venue.photoUrls.length > 0 && (
                        <Image
                            source={{ uri: photoUrl(venue.photoUrls[0]) }}
                            style={styles.cover}
                            contentFit="cover"
                        />
                    )}

                    <ThemedText type="smallBold">{venue.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        📍 {formatAddress(venue)}
                    </ThemedText>
                    <ThemedText type="smallBold">💰 {formatPrice(venue.pricePerHour)}</ThemedText>

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
        overflow: 'hidden',
    },
    cover: {
        height: 140,
        marginHorizontal: -Spacing.three,
        marginTop: -Spacing.three,
        marginBottom: Spacing.one,
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