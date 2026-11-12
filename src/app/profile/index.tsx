import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile, getPlayerMatches, getPlayerReviewSummary, updateMyProfile } from '@/api/client';
import type { Match, Player, PlayerReviewSummary } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { PillButton } from '@/components/ui/pill-button';
import {
    BottomTabInset,
    Brand,
    FontFamily,
    MaxContentWidth,
    Radius,
    Spacing,
    TopTabInset,
} from '@/constants/theme';
import { useFavorites } from '@/favorites/favorites-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDayTime } from '@/utils/format';
import { past } from '@/utils/matches';
import { REVIEW_TAG_LABELS } from '@/utils/review-tags';

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
    const favorites = useFavorites();
    const theme = useTheme();

    const [profile, setProfile] = useState<Player | null>(null);
    const [pastMatches, setPastMatches] = useState<Match[]>([]);
    const [summary, setSummary] = useState<PlayerReviewSummary | null>(null);
    const [editing, setEditing] = useState(false);
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function fillForm(player: Player) {
        setAge(toText(player.age));
        setHeight(toText(player.height));
        setWeight(toText(player.weight));
    }

    useEffect(() => {
        getMyProfile()
            .then((player) => {
                setProfile(player);
                fillForm(player);
            })
            .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, []);

    // натпреварите и оценките се освежуваат секогаш кога ќе се вратиш на табот
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getPlayerMatches(user.id)
                .then((matches) => setPastMatches(past(matches)))
                .catch(() => {});
            getPlayerReviewSummary(user.id)
                .then(setSummary)
                .catch(() => {});
        }, [user]),
    );

    function cancelEdit() {
        if (profile) fillForm(profile);
        setError(null);
        setEditing(false);
    }

    async function onSave() {
        if (!profile) return;
        const values = { age: toNumber(age), height: toNumber(height), weight: toNumber(weight) };
        if (Object.values(values).some((v) => v !== null && (Number.isNaN(v) || v <= 0))) {
            setError('Age, height and weight must be positive numbers');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            // PUT ги заменува сите полиња, затоа домашната локација се праќа непроменета
            const updated = await updateMyProfile({
                ...values,
                homeLat: profile.homeLat,
                homeLong: profile.homeLong,
            });
            setProfile(updated);
            setEditing(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    if (loading || !user) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={theme.tint} />
            </ThemedView>
        );
    }

    const rating = summary?.averageStars ?? null;
    const topTags = summary?.tags.slice(0, 2).map((t) => REVIEW_TAG_LABELS[t.tag]) ?? [];
    const lastMatch = pastMatches[0];
    const inputStyle = [
        styles.input,
        { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
    ];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <ThemedText type="subtitle" style={styles.pageTitle}>
                        Profile
                    </ThemedText>

                    {/* кој си и колку играш */}
                    <Card variant="dark" style={styles.hero}>
                        <View style={styles.heroTop}>
                            <Avatar username={user.username} size={68} ring="rgba(255,255,255,0.9)" />
                            <View style={styles.flex}>
                                <ThemedText style={styles.name} numberOfLines={1}>
                                    {user.username}
                                </ThemedText>
                                <ThemedText style={styles.muted} numberOfLines={1}>
                                    {user.email}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={[styles.stats, { borderTopColor: Brand.onDarkFaint }]}>
                            <Stat value={String(pastMatches.length)} label="Matches" />
                            <View style={styles.divider} />
                            <Stat value={rating === null ? '—' : rating.toFixed(1)} label="Rating" accent />
                            <View style={styles.divider} />
                            <Stat value={String(summary?.reviewCount ?? 0)} label="Reviews" />
                        </View>
                    </Card>

                    {/* лични податоци: преглед, а уредување на клик */}
                    <Card style={styles.details}>
                        <View style={styles.detailsHeader}>
                            <ThemedText style={styles.cardTitle}>Your details</ThemedText>
                            {!editing && (
                                <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                                    <ThemedText type="smallBold" themeColor="tint">
                                        Edit
                                    </ThemedText>
                                </Pressable>
                            )}
                        </View>

                        {editing ? (
                            <>
                                <Field label="Age" value={age} onChange={setAge} style={inputStyle} keyboard="number-pad" />
                                <Field label="Height (cm)" value={height} onChange={setHeight} style={inputStyle} />
                                <Field label="Weight (kg)" value={weight} onChange={setWeight} style={inputStyle} />
                                {error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
                                <View style={styles.editActions}>
                                    <PillButton label="Cancel" variant="outline" onPress={cancelEdit} style={styles.flex} />
                                    <PillButton label="Save" loading={saving} onPress={onSave} style={styles.flex} />
                                </View>
                            </>
                        ) : (
                            <View style={styles.tiles}>
                                <Tile label="Age" value={profile?.age ? `${profile.age}` : '—'} />
                                <Tile label="Height" value={profile?.height ? `${profile.height} cm` : '—'} />
                                <Tile label="Weight" value={profile?.weight ? `${profile.weight} kg` : '—'} />
                            </View>
                        )}
                    </Card>

                    <ListGroup label="Activity">
                        <ListRow
                            icon="clock"
                            title="Past matches"
                            subtitle={lastMatch ? `Last: ${formatDayTime(lastMatch.dateFrom)}` : 'No matches played yet'}
                            value={pastMatches.length}
                            onPress={() => router.push('/profile/past-matches')}
                        />
                        <ListRow
                            icon="bookmark"
                            title="Saved matches"
                            value={favorites.matches.length}
                            onPress={() => router.push('/profile/saved-matches')}
                        />
                        <ListRow
                            icon="heart"
                            title="Favorite venues"
                            value={favorites.venues.length}
                            onPress={() => router.push('/profile/favorite-venues')}
                        />
                        <ListRow
                            icon="star"
                            title="What teammates say"
                            subtitle={topTags.length > 0 ? topTags.join(' · ') : 'No reviews yet'}
                            onPress={() =>
                                router.push({ pathname: '/matches/player/[id]', params: { id: user.id } })
                            }
                        />
                    </ListGroup>

                    <ListGroup label="Account">
                        <ListRow icon="log-out" title="Log out" danger onPress={logout} />
                    </ListGroup>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
    return (
        <View style={styles.stat}>
            <ThemedText style={[styles.statValue, accent && { color: Brand.accent }]}>{value}</ThemedText>
            <ThemedText style={styles.statLabel}>{label}</ThemedText>
        </View>
    );
}

function Tile({ label, value }: { label: string; value: string }) {
    const theme = useTheme();
    return (
        <View style={[styles.tile, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.tileLabel} themeColor="textSecondary">
                {label}
            </ThemedText>
            <ThemedText style={styles.tileValue}>{value}</ThemedText>
        </View>
    );
}

type FieldProps = {
    label: string;
    value: string;
    onChange: (text: string) => void;
    style: object[];
    keyboard?: 'number-pad' | 'decimal-pad';
};

function Field({ label, value, onChange, style, keyboard = 'decimal-pad' }: FieldProps) {
    const theme = useTheme();
    return (
        <View style={styles.field}>
            <ThemedText type="smallBold">{label}</ThemedText>
            <TextInput
                style={style}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboard}
                placeholder="—"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={label}
            />
        </View>
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
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.four,
    },
    pageTitle: {
        marginHorizontal: Spacing.one,
    },
    flex: {
        flex: 1,
    },
    hero: {
        gap: Spacing.four,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    name: {
        color: Brand.onDark,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: 800,
    },
    muted: {
        color: Brand.onDarkMuted,
        fontSize: 14,
        lineHeight: 20,
    },
    stats: {
        flexDirection: 'row',
        paddingTop: Spacing.three,
        borderTopWidth: 1,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: Brand.onDark,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: 800,
    },
    statLabel: {
        color: Brand.onDarkMuted,
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        width: 1,
        backgroundColor: Brand.onDarkFaint,
    },
    details: {
        gap: Spacing.three,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: 800,
    },
    tiles: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    tile: {
        flex: 1,
        padding: Spacing.three,
        borderRadius: Radius.md,
        gap: 2,
    },
    tileLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 600,
    },
    tileValue: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 800,
    },
    field: {
        gap: Spacing.one,
    },
    input: {
        height: 50,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        fontSize: 16,
        fontFamily: FontFamily.medium,
    },
    editActions: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    error: {
        color: Brand.danger,
    },
});
