import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getVenueReviews } from '@/api/client';
import type { VenueReviews as VenueReviewsData } from '@/api/types';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function VenueReviews({ venueId }: { venueId: number }) {
    const [data, setData] = useState<VenueReviewsData | null>(null);

    useFocusEffect(
        useCallback(() => {
            getVenueReviews(venueId).then(setData).catch(() => setData(null));
        }, [venueId]),
    );

    if (!data) {
        return null;
    }

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <ThemedText type="smallBold">Reviews</ThemedText>
                {data.averageStars !== null && (
                    <View style={styles.summary}>
                        <StarRating value={data.averageStars} size={16} />
                        <ThemedText type="smallBold">
                            {data.averageStars.toFixed(1)} · {data.reviewCount}
                        </ThemedText>
                    </View>
                )}
            </View>

            {data.reviews.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                    No reviews yet. Players can review the venue after a match here.
                </ThemedText>
            ) : (
                data.reviews.map((review) => (
                    <ThemedView key={review.id} type="backgroundElement" style={styles.review}>
                        <View style={styles.reviewHeader}>
                            <ThemedText type="smallBold">{review.author}</ThemedText>
                            <StarRating value={review.stars} size={14} />
                        </View>
                        {review.comment && <ThemedText type="small">{review.comment}</ThemedText>}
                        <ThemedText type="small" themeColor="textSecondary">
                            {new Date(review.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </ThemedText>
                    </ThemedView>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.two,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    review: {
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.one,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});