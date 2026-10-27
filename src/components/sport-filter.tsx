import { Pressable, ScrollView, StyleSheet } from 'react-native';

import type { Sport } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { sportEmoji } from '@/utils/sports';

type Props = {
    sports: Sport[];
    selectedId: number | null;
    onSelect: (sportId: number | null) => void;
};

export function SportFilter({ sports, selectedId, onSelect }: Props) {
    return (
        <ScrollView
            horizontal
            style={styles.scroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            <Chip label="All" selected={selectedId === null} onPress={() => onSelect(null)} />
            {sports.map((sport) => (
                <Chip
                    key={sport.id}
                    label={`${sportEmoji(sport.name)} ${sport.name}`}
                    selected={selectedId === sport.id}
                    onPress={() => onSelect(sport.id)}
                />
            ))}
        </ScrollView>
    );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView
                type={selected ? 'backgroundSelected' : 'backgroundElement'}
                style={[styles.chip, selected && styles.chipSelected]}>
                <ThemedText type={selected ? 'smallBold' : 'small'}>{label}</ThemedText>
            </ThemedView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 0,
    },
    row: {
        gap: Spacing.two,
        paddingVertical: Spacing.one,
    },
    chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.four,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        borderColor: '#3c87f7',
    },
    pressed: {
        opacity: 0.7,
    },
});