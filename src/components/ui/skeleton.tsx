import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
    width?: DimensionValue;
    height?: number;
    radius?: number;
    style?: StyleProp<ViewStyle>;
};

// сиво „трепкачко“ место каде што ќе дојде содржина
export function Skeleton({ width = '100%', height = 14, radius = 7, style }: Props) {
    const theme = useTheme();
    const pulse = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const useNativeDriver = Platform.OS !== 'web';
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver }),
                Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <Animated.View
            style={[{ width, height, borderRadius: radius, backgroundColor: theme.backgroundSelected, opacity: pulse }, style]}
        />
    );
}

export function MatchCardSkeleton() {
    return (
        <Card style={styles.card}>
            <Skeleton width="35%" height={11} />
            <Skeleton width="65%" height={22} radius={8} />
            <Skeleton width="50%" />
            <View style={styles.row}>
                {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} width={40} height={40} radius={20} />
                ))}
            </View>
        </Card>
    );
}

export function VenueCardSkeleton() {
    return (
        <Card style={styles.venue}>
            <Skeleton height={150} radius={0} />
            <View style={styles.venueBody}>
                <Skeleton width="60%" height={18} radius={8} />
                <Skeleton width="80%" />
                <View style={styles.row}>
                    <Skeleton width={80} height={26} radius={13} />
                    <Skeleton width={90} height={26} radius={13} />
                </View>
            </View>
        </Card>
    );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <Card style={styles.list}>
            {Array.from({ length: rows }, (_, i) => (
                <View key={i} style={styles.listRow}>
                    <Skeleton width={40} height={40} radius={13} />
                    <View style={styles.flex}>
                        <Skeleton width="70%" />
                        <Skeleton width="45%" height={11} />
                    </View>
                </View>
            ))}
        </Card>
    );
}

// цел екран додека се вчитува: hero блок + картички
export function ScreenSkeleton({ variant = 'detail' }: { variant?: 'detail' | 'home' }) {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {variant === 'detail' && <Skeleton width={44} height={44} radius={22} />}
                    <Skeleton height={variant === 'home' ? 250 : 230} radius={Radius.xl} />
                    <MatchCardSkeleton />
                    <MatchCardSkeleton />
                </View>
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
        gap: Spacing.four,
    },
    card: {
        gap: Spacing.three,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    venue: {
        padding: 0,
        gap: 0,
        overflow: 'hidden',
    },
    venueBody: {
        padding: Spacing.three,
        gap: Spacing.two,
    },
    list: {
        gap: Spacing.three,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    flex: {
        flex: 1,
        gap: Spacing.two,
    },
});
