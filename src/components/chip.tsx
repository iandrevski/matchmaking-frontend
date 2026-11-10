import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

type Props = {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
};

export function Chip({ label, selected, onPress, disabled }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
            <ThemedView
                type={selected ? 'backgroundSelected' : 'backgroundElement'}
                style={[styles.chip, selected && styles.chipSelected]}>
                <ThemedText type={selected ? 'smallBold' : 'small'} style={selected && styles.selectedText}>
                    {label}
                </ThemedText>
            </ThemedView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.four,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: Brand.primary,
        borderColor: Brand.primary,
    },
    selectedText: {
        color: Brand.onPrimary,
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.35,
    },
});