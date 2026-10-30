import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile, getPlayerMatches, updateMyProfile } from '@/api/client';
import type { Match, Player } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { MatchCard } from '@/components/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { past } from '@/utils/matches';

// "" → null, "180,5" → 180.5, невалиден текст → NaN
function toNumber(text: string) {
    const value = text.trim().replace(',', '.');
    return value === '' ? null : Number(value);
}

function toText(value: number | null) {
    return value === null ? '' : String(value);
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const theme = useTheme();

    const [profile, setProfile] = useState<Player | null>(null);
    const [pastMatches, setPastMatches] = useState<Match[]>([]);
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // формата се полни само еднаш, за да не се избришат внесените податоци при враќање на табот
    useEffect(() => {
        getMyProfile()
            .then((player) => {
                setProfile(player);
                setAge(toText(player.age));
                setHeight(toText(player.height));
                setWeight(toText(player.weight));
            })
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getPlayerMatches(user.id)
                .then((matches) => setPastMatches(past(matches)))
                .catch(() => {});
        }, [user]),
    );

    async function onSave() {
        if (!profile) return;
        const values = { age: toNumber(age), height: toNumber(height), weight: toNumber(weight) };
        if (Object.values(values).some((v) => v !== null && (Number.isNaN(v) || v <= 0))) {
            setError('Age, height and weight must be positive numbers');
            return;
        }

        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            // PUT ги заменува сите полиња, затоа домашната локација се праќа непроменета
            const updated = await updateMyProfile({
                ...values,
                homeLat: profile.homeLat,
                homeLong: profile.homeLong,
            });
            setProfile(updated);
            setSaved(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <ThemedText type="subtitle">{user?.username}</ThemedText>
                            <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
                        </View>
                        <Pressable onPress={logout} style={({ pressed }) => pressed && styles.pressed}>
                            <ThemedText type="small" style={styles.link}>
                                Log out
                            </ThemedText>
                        </Pressable>
                    </View>

                    <ThemedView type="backgroundElement" style={styles.stat}>
                        <ThemedText type="small" themeColor="textSecondary">
                            Matches played
                        </ThemedText>
                        <ThemedText type="smallBold">{pastMatches.length}</ThemedText>
                    </ThemedView>

                    <View style={styles.section}>
                        <ThemedText type="smallBold">Your details</ThemedText>
                        <TextInput
                            style={inputStyle}
                            placeholder="Age"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="number-pad"
                            value={age}
                            onChangeText={setAge}
                        />
                        <TextInput
                            style={inputStyle}
                            placeholder="Height (cm)"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="decimal-pad"
                            value={height}
                            onChangeText={setHeight}
                        />
                        <TextInput
                            style={inputStyle}
                            placeholder="Weight (kg)"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="decimal-pad"
                            value={weight}
                            onChangeText={setWeight}
                        />

                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        {saved && <ThemedText style={styles.success}>Saved</ThemedText>}

                        <Pressable
                            onPress={onSave}
                            disabled={saving || !profile}
                            style={({ pressed }) => [
                                styles.button,
                                (saving || !profile) && styles.buttonDisabled,
                                pressed && styles.pressed,
                            ]}>
                            {saving ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <ThemedText style={styles.buttonText}>Save</ThemedText>
                            )}
                        </Pressable>
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="smallBold">Past matches</ThemedText>
                        {pastMatches.length === 0 ? (
                            <ThemedText type="small" themeColor="textSecondary">
                                No matches played yet.
                            </ThemedText>
                        ) : (
                            pastMatches.map((m) => <MatchCard key={m.id} match={m} />)
                        )}
                    </View>
                </ScrollView>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingTop: TopTabInset,
    },
    content: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.three,
    },
    headerText: {
        flex: 1,
    },
    link: {
        color: '#3c87f7',
    },
    stat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.three,
        borderRadius: Spacing.three,
    },
    section: {
        gap: Spacing.two,
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
    success: {
        color: '#30a46c',
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
    buttonText: {
        color: '#ffffff',
    },
    pressed: {
        opacity: 0.8,
    },
});