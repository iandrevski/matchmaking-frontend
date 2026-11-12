import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Props = {
    children: string;
    right?: React.ReactNode;
};

// наслов на секција во екран: „Upcoming matches“, „Reviews“…
export function SectionTitle({ children, right }: Props) {
    return (
        <View style={styles.row}>
            <ThemedText style={styles.title}>{children}</ThemedText>
            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        flexShrink: 1,
        fontSize: 20,
        lineHeight: 26,
        fontWeight: 800,
        letterSpacing: -0.2,
    },
});
