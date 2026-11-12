import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchCard } from '@/components/match-card';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';

export default function SavedMatchesScreen() {
    const { matches } = useFavorites();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ScreenHeader title="Saved matches" subtitle={`${matches.length} saved`} fallback="/profile" />

                    {matches.length === 0 ? (
                        <EmptyState
                            icon="bookmark"
                            title="No saved matches"
                            text="Tap the heart on a match to keep it here.">
                            <PillButton label="Browse matches" variant="soft" size="sm" onPress={() => router.push('/matches')} />
                        </EmptyState>
                    ) : (
                        matches.map((m) => <MatchCard key={m.id} match={m} />)
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
