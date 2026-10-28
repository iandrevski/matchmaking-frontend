import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedView } from '@/components/themed-view';

SplashScreen.preventAutoHideAsync();

// најавен → апликацијата; не → Login; додека се проверува токенот → spinner
function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return user ? <AppTabs /> : <AuthScreen />;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    return (
        <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <AnimatedSplashOverlay />
                <RootNavigator />
            </ThemeProvider>
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