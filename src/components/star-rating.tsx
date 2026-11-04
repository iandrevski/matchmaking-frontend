import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const FILLED = '#f5a524';
const EMPTY = 'rgba(139,141,152,0.45)';

type Props = {
    value: number; // 0 = уште не е оценето
    onChange?: (stars: number) => void; // без onChange = само приказ
    size?: number;
};

export function StarRating({ value, onChange, size = 24 }: Props) {
    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((star) => {
                const text = (
                    <ThemedText style={{ fontSize: size, lineHeight: size + 6, color: star <= Math.round(value) ? FILLED : EMPTY }}>
                        ★
                    </ThemedText>
                );
                return onChange ? (
                    <Pressable
                        key={star}
                        onPress={() => onChange(star)}
                        accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
                        hitSlop={4}>
                        {text}
                    </Pressable>
                ) : (
                    <View key={star}>{text}</View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 2,
    },
});