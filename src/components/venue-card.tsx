import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { photoUrl } from '@/api/client';
import type { Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { formatAddress, formatPrice } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

export function VenueCard({ venue }: { venue: Venue }) {
    const { user } = useAuth();
    const { isFavoriteVenue, toggleVenue } = useFavorites();
    const isPlayer = user?.role === 'ROLE_USER';

    return (
        <View>
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

                        {/* место за срцето да не го покрива името */}
                        <ThemedText type="smallBold" style={isPlayer && styles.nameWithHeart}>
                            {venue.name}
                        </ThemedText>
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

            {/* надвор од линкот: клик на срцето не го отвора теренот */}
            {isPlayer && (
                <View style={[styles.heart, venue.photoUrls.length > 0 && styles.heartOnPhoto]}>
                    <FavoriteButton active={isFavoriteVenue(venue.id)} onToggle={() => toggleVenue(venue.id)} />
                </View>
            )}
        </View>
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
    nameWithHeart: {
        paddingRight: 52,
    },
    heart: {
        position: 'absolute',
        top: Spacing.two,
        right: Spacing.two,
    },
    heartOnPhoto: {
        top: Spacing.two,
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