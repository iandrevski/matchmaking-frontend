import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { photoUrl } from '@/api/client';
import type { Venue } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { FavoriteButton } from '@/components/favorite-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, SportIcon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { useTheme } from '@/hooks/use-theme';
import { formatAddress, formatPrice } from '@/utils/format';

export function VenueCard({ venue }: { venue: Venue }) {
    const theme = useTheme();
    const { user } = useAuth();
    const { isFavoriteVenue, toggleVenue } = useFavorites();
    const isPlayer = user?.role === 'ROLE_USER';
    const cover = venue.photoUrls[0];

    return (
        <View>
            <Link href={{ pathname: '/venues/[id]', params: { id: venue.id } }} asChild>
                <Pressable style={({ pressed }) => pressed && styles.pressed}>
                    <Card style={styles.card}>
                        {/* насловна: првата слика, или икона на спортот ако нема слики */}
                        {cover ? (
                            <Image
                                source={{ uri: photoUrl(cover) }}
                                style={[styles.cover, { backgroundColor: theme.backgroundSelected }]}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.cover, styles.placeholder, { backgroundColor: theme.tintSoft }]}>
                                <SportIcon sport={venue.sports[0]?.name ?? ''} size={44} color={theme.tint} />
                            </View>
                        )}

                        <View style={styles.body}>
                            <View style={styles.titleRow}>
                                <ThemedText style={styles.name} numberOfLines={1}>
                                    {venue.name}
                                </ThemedText>
                                <View style={[styles.price, { backgroundColor: theme.tintSoft }]}>
                                    <ThemedText style={[styles.priceText, { color: theme.tint }]}>
                                        {formatPrice(venue.pricePerHour)}
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={styles.addressRow}>
                                <Icon name="map-pin" size={14} tone="textSecondary" />
                                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
                                    {formatAddress(venue)}
                                </ThemedText>
                            </View>

                            <View style={styles.sports}>
                                {venue.sports.map((sport) => (
                                    <View key={sport.id} style={[styles.sport, { borderColor: theme.border }]}>
                                        <SportIcon sport={sport.name} size={14} color={theme.tint} />
                                        <ThemedText style={styles.sportText}>{sport.name}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Card>
                </Pressable>
            </Link>

            {/* надвор од линкот: клик на срцето не го отвора теренот */}
            {isPlayer && (
                <View style={styles.heart}>
                    <FavoriteButton active={isFavoriteVenue(venue.id)} onToggle={() => toggleVenue(venue.id)} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 0,
        gap: 0,
        overflow: 'hidden',
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },
    cover: {
        height: 150,
        width: '100%',
    },
    placeholder: {
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: Spacing.three,
        gap: Spacing.two,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    name: {
        flex: 1,
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 800,
        letterSpacing: -0.2,
    },
    price: {
        paddingHorizontal: Spacing.two,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
    },
    priceText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 800,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    flex: {
        flex: 1,
    },
    sports: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
        marginTop: Spacing.one,
    },
    sport: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        height: 28,
        paddingHorizontal: Spacing.two,
        borderRadius: Radius.pill,
        borderWidth: 1,
    },
    sportText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 700,
    },
    heart: {
        position: 'absolute',
        top: Spacing.two,
        right: Spacing.two,
    },
});
