import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';
import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { FavoritesProvider } from '@/favorites/favorites-context';
import { ToastProvider } from '@/feedback/toast-context';
import {NotificationsProvider} from "@/notifications/notifications-context";

SplashScreen.preventAutoHideAsync();

// header-и и позадини на навигацијата во бојата на Sportify
const LightNavTheme: Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: Brand.primary,
        background: Colors.light.background,
        card: Colors.light.background,
        text: Colors.light.text,
        border: Colors.light.border,
    },
};

const DarkNavTheme: Theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: Colors.dark.tint,
        background: Colors.dark.background,
        card: Colors.dark.background,
        text: Colors.dark.text,
        border: Colors.dark.border,
    },
};

// најавен → апликацијата; не → Login; додека се проверува токенот → spinner
function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={Brand.primary} />
            </ThemedView>
        );
    }

    return user ? <AppTabs /> : <AuthScreen />;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [fontsLoaded, fontError] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    // splash-от останува додека не се вчита фонтот (ако падне, продолжи со системскиот)
    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <AuthProvider>
            <FavoritesProvider>
                <NotificationsProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
                        <ToastProvider>
                            <AnimatedSplashOverlay />
                            <RootNavigator />
                        </ToastProvider>
                    </ThemeProvider>
                </NotificationsProvider>
            </FavoritesProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});