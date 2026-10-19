import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {MaxContentWidth, Spacing, TopTabInset} from '@/constants/theme';

export default function MatchDetailsScreen() {
    // [id] in the file name → the value from the URL, e.g. /matches/1 → id = "1"
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">Match #{id}</ThemedText>
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
        paddingHorizontal: Spacing.four,
        paddingTop: TopTabInset + Spacing.four,
    },
});