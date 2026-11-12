import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/utils/haptics';

type Props = {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
    // икона пред текстот; ја добива бојата на текстот (бела кога е избран)
    renderIcon?: (color: string) => React.ReactNode;
};

export function Chip({ label, selected, onPress, disabled, renderIcon }: Props) {
    const theme = useTheme();
    const color = selected ? Brand.onPrimary : theme.text;

    return (
        <Pressable
            onPress={() => {
                haptic.tap();
                onPress();
            }}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
            <View
                style={[
                    styles.chip,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    selected && styles.chipSelected,
                ]}>
                {renderIcon?.(selected ? Brand.onPrimary : theme.tint)}
                <ThemedText type={selected ? 'smallBold' : 'small'} style={[styles.label, { color }]}>
                    {label}
                </ThemedText>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        height: 40,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.pill,
        borderWidth: 1,
    },
    chipSelected: {
        backgroundColor: Brand.primary,
        borderColor: Brand.primary,
    },
    label: {
        fontWeight: 700,
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.35,
    },
});
