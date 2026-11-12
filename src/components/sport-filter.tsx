import { ScrollView, StyleSheet } from 'react-native';

import type { Sport } from '@/api/types';
import { Chip } from '@/components/chip';
import { SportIcon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';

type Props = {
    sports: Sport[];
    selectedId: number | null;
    onSelect: (sportId: number | null) => void;
    showAll?: boolean;
};

export function SportFilter({ sports, selectedId, onSelect, showAll = true }: Props) {
    return (
        <ScrollView
            horizontal
            style={styles.scroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {showAll && <Chip label="All" selected={selectedId === null} onPress={() => onSelect(null)} />}
            {sports.map((sport) => (
                <Chip
                    key={sport.id}
                    label={sport.name}
                    selected={selectedId === sport.id}
                    onPress={() => onSelect(sport.id)}
                    renderIcon={(color) => <SportIcon sport={sport.name} size={17} color={color} />}
                />
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 0,
        flexShrink: 0,
    },
    row: {
        gap: Spacing.two,
        paddingVertical: Spacing.one,
    },
});
