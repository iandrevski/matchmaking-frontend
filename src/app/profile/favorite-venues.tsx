import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { VenueCard } from '@/components/venue-card';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';

export default function FavoriteVenuesScreen() {
    const { venues } = useFavorites();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader title="Favorite venues" subtitle={`${venues.length} saved`} fallback="/profile" />

                    {venues.length === 0 ? (
                        <EmptyState
                            icon="heart"
                            title="No favorite venues"
                            text="Tap the heart on a venue to keep it here.">
                            <PillButton label="Browse venues" variant="soft" size="sm" onPress={() => router.push('/venues')} />
                        </EmptyState>
                    ) : (
                        venues.map((v) => <VenueCard key={v.id} venue={v} />)
                    )}
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
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingTop: TopTabInset,
    },
    content: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.three,
    },
});
