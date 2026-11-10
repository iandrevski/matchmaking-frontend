import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { PillButton } from '@/components/ui/pill-button';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'login' | 'register';

export function AuthScreen() {
    const { login, register } = useAuth();
    const theme = useTheme();

    const [mode, setMode] = useState<Mode>('login');
    const [accountType, setAccountType] = useState<'player' | 'partner'>('player');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isRegister = mode === 'register';
    const canSubmit =
        username.trim() !== '' && password !== '' && (!isRegister || email.trim() !== '') && !submitting;

    async function onSubmit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            if (isRegister) {
                await register({ username: username.trim(), email: email.trim(), password }, accountType);
            } else {
                await login(username.trim(), password);
            }
            // успех: AuthProvider го поставува user → root layout сам ги прикажува Tabs
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
            setSubmitting(false);
        }
    }

    function switchMode() {
        setMode(isRegister ? 'login' : 'register');
        setError(null);
    }

    const inputStyle = [
        styles.input,
        { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
    ];

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                        {/* горе: бренд и порака */}
                        <View style={styles.intro}>
                            <ThemedText style={styles.brand}>⚽ Sportify</ThemedText>
                            <ThemedText style={styles.headline}>
                                Find your game.{'\n'}
                                <ThemedText style={[styles.headline, styles.accent]}>Meet your team.</ThemedText>
                            </ThemedText>
                            <ThemedText style={styles.lead}>
                                Join matches near you, fill your squad and play more.
                            </ThemedText>
                        </View>

                        {/* долу: форма во бела картичка */}
                        <View style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
                            <ThemedText style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</ThemedText>

                            {isRegister && (
                                <View style={styles.accountType}>
                                    <Chip
                                        label="🏃 Player"
                                        selected={accountType === 'player'}
                                        onPress={() => setAccountType('player')}
                                    />
                                    <Chip
                                        label="🏟️ Venue owner"
                                        selected={accountType === 'partner'}
                                        onPress={() => setAccountType('partner')}
                                    />
                                </View>
                            )}

                            <TextInput
                                style={inputStyle}
                                placeholder="Username"
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={username}
                                onChangeText={setUsername}
                            />

                            {isRegister && (
                                <TextInput
                                    style={inputStyle}
                                    placeholder="Email"
                                    placeholderTextColor={theme.textSecondary}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            )}

                            <TextInput
                                style={inputStyle}
                                placeholder="Password"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                onSubmitEditing={onSubmit}
                            />

                            {error && (
                                <View style={styles.errorBox}>
                                    <ThemedText type="small" style={styles.error}>
                                        {error}
                                    </ThemedText>
                                </View>
                            )}

                            <PillButton
                                label={isRegister ? 'Create account' : 'Log in'}
                                onPress={onSubmit}
                                disabled={!canSubmit}
                                loading={submitting}
                            />

                            <Pressable onPress={switchMode} hitSlop={8}>
                                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                                    {isRegister ? 'Already have an account? ' : 'New to Sportify? '}
                                    <ThemedText type="smallBold" themeColor="tint">
                                        {isRegister ? 'Log in' : 'Sign up'}
                                    </ThemedText>
                                </ThemedText>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: Brand.forest,
    },
    safeArea: {
        flex: 1,
        maxWidth: 480,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        padding: Spacing.three,
        gap: Spacing.five,
    },
    intro: {
        paddingHorizontal: Spacing.two,
        gap: Spacing.three,
    },
    brand: {
        color: Brand.onDark,
        fontWeight: 800,
        letterSpacing: 0.3,
    },
    headline: {
        color: Brand.onDark,
        fontSize: 38,
        lineHeight: 46,
        fontWeight: 700,
    },
    accent: {
        color: Brand.accent,
    },
    lead: {
        color: Brand.onDarkMuted,
        fontSize: 16,
        lineHeight: 24,
    },
    sheet: {
        borderRadius: Radius.xl,
        padding: Spacing.four,
        gap: Spacing.three,
    },
    title: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: 700,
    },
    accountType: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    input: {
        height: 52,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        fontSize: 16,
    },
    errorBox: {
        padding: Spacing.three,
        borderRadius: 14,
        backgroundColor: 'rgba(214,69,69,0.12)',
    },
    error: {
        color: Brand.danger,
    },
    center: {
        textAlign: 'center',
    },
});
