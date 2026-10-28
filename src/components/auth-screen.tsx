import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'login' | 'register';

export function AuthScreen() {
    const { login, register } = useAuth();
    const theme = useTheme();

    const [mode, setMode] = useState<Mode>('login');
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
                await register({ username: username.trim(), email: email.trim(), password });
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

    const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.form}>
                    <ThemedText type="subtitle">Sportify</ThemedText>
                    <ThemedText themeColor="textSecondary">
                        {isRegister ? 'Create an account to join matches' : 'Log in to find a match'}
                    </ThemedText>

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

                    {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                    <Pressable
                        onPress={onSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.button,
                            !canSubmit && styles.buttonDisabled,
                            pressed && styles.buttonPressed,
                        ]}>
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>{isRegister ? 'Create account' : 'Log in'}</ThemedText>
                        )}
                    </Pressable>

                    <Pressable onPress={switchMode}>
                        <ThemedText type="small" style={styles.link}>
                            {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                        </ThemedText>
                    </Pressable>
                </KeyboardAvoidingView>
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
        maxWidth: 420,
        justifyContent: 'center',
        paddingHorizontal: Spacing.four,
    },
    form: {
        gap: Spacing.three,
    },
    input: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        fontSize: 16,
    },
    error: {
        color: '#e5484d',
    },
    button: {
        backgroundColor: '#3c87f7',
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonText: {
        color: '#ffffff',
    },
    link: {
        color: '#3c87f7',
        textAlign: 'center',
    },
});