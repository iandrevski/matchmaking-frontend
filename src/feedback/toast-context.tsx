import { Feather } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';

type Tone = 'success' | 'error' | 'info';
type ToastInput = string | { message: string; tone?: Tone };
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

const VISIBLE_MS = 2600;
const useNativeDriver = Platform.OS !== 'web';

const TONES: Record<Tone, { bg: string; icon: 'check-circle' | 'alert-circle' | 'info'; iconColor: string }> = {
    success: { bg: Brand.forest, icon: 'check-circle', iconColor: Brand.accent },
    error: { bg: Brand.danger, icon: 'alert-circle', iconColor: '#ffffff' },
    info: { bg: Brand.forest, icon: 'info', iconColor: '#ffffff' },
};

// кратка порака горе на екранот: „You're in! 🎉“
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<Toast | null>(null);
    const anim = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(
        (input: ToastInput) => {
            const { message, tone = 'success' } = typeof input === 'string' ? { message: input } : input;
            setToast({ id: Date.now(), message, tone });

            if (timer.current) clearTimeout(timer.current);
            anim.setValue(0);
            Animated.spring(anim, { toValue: 1, useNativeDriver, friction: 7 }).start();
            timer.current = setTimeout(() => {
                Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver }).start(() => setToast(null));
            }, VISIBLE_MS);
        },
        [anim],
    );

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const look = toast ? TONES[toast.tone] : null;

    return (
        <ToastContext.Provider value={show}>
            {children}
            {toast && look && (
                <Animated.View
                    pointerEvents="none"
                    accessibilityLiveRegion="polite"
                    style={[
                        styles.wrap,
                        {
                            top: insets.top + TopTabInset + Spacing.two,
                            opacity: anim,
                            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
                        },
                    ]}>
                    <View key={toast.id} style={[styles.toast, { backgroundColor: look.bg }]}>
                        <Feather name={look.icon} size={20} color={look.iconColor} />
                        <ThemedText style={styles.text} numberOfLines={2}>
                            {toast.message}
                        </ThemedText>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        left: Spacing.three,
        right: Spacing.three,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        maxWidth: MaxContentWidth - Spacing.five,
        paddingHorizontal: Spacing.three,
        paddingVertical: 12,
        borderRadius: Radius.pill,
        boxShadow: '0px 10px 30px rgba(16, 38, 27, 0.25)',
    },
    text: {
        flexShrink: 1,
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: 700,
    },
});
