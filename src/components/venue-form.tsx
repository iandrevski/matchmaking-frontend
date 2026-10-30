import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSports } from '@/api/client';
import type { Sport, Venue, VenueRequest } from '@/api/types';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sportEmoji } from '@/utils/sports';

type Props = {
    title: string;
    submitLabel: string;
    initial?: Venue;
    onSubmit: (body: VenueRequest) => Promise<void>;
};

function toCoordinate(text: string) {
    const value = text.trim().replace(',', '.');
    return value === '' ? null : Number(value);
}

export function VenueForm({ title, submitLabel, initial, onSubmit }: Props) {
    const theme = useTheme();

    const [sports, setSports] = useState<Sport[]>([]);
    const [name, setName] = useState(initial?.name ?? '');
    const [city, setCity] = useState(initial?.city ?? '');
    const [municipality, setMunicipality] = useState(initial?.municipality ?? '');
    const [address, setAddress] = useState(initial?.address ?? '');
    const [latitude, setLatitude] = useState(initial?.latitude?.toString() ?? '');
    const [longitude, setLongitude] = useState(initial?.longitude?.toString() ?? '');
    const [sportIds, setSportIds] = useState<number[]>(initial?.sports.map((s) => s.id) ?? []);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSports().then(setSports).catch(() => setError('Could not load sports'));
    }, []);

    function toggleSport(id: number) {
        setSportIds((current) =>
            current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
        );
    }

    async function submit() {
        const lat = toCoordinate(latitude);
        const lng = toCoordinate(longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            setError('Latitude and longitude must be numbers');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                name: name.trim(),
                city: city.trim() || null,
                municipality: municipality.trim() || null,
                address: address.trim() || null,
                latitude: lat,
                longitude: lng,
                sportIds,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
            setSubmitting(false);
        }
    }

    const canSubmit = name.trim() !== '' && sportIds.length > 0 && !submitting;
    const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
    const field = (placeholder: string, value: string, onChange: (text: string) => void) => (
        <TextInput
            style={inputStyle}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChange}
        />
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <ThemedText type="subtitle">{title}</ThemedText>

                    {field('Venue name', name, setName)}
                    {field('City', city, setCity)}
                    {field('Municipality', municipality, setMunicipality)}
                    {field('Address', address, setAddress)}
                    {field('Latitude (e.g. 41.9856)', latitude, setLatitude)}
                    {field('Longitude (e.g. 21.4640)', longitude, setLongitude)}

                    <View style={styles.section}>
                        <ThemedText type="smallBold">Sports</ThemedText>
                        <View style={styles.wrap}>
                            {sports.map((sport) => (
                                <Chip
                                    key={sport.id}
                                    label={`${sportEmoji(sport.name)} ${sport.name}`}
                                    selected={sportIds.includes(sport.id)}
                                    onPress={() => toggleSport(sport.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                    <Pressable
                        onPress={submit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.button,
                            !canSubmit && styles.buttonDisabled,
                            pressed && styles.buttonPressed,
                        ]}>
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>{submitLabel}</ThemedText>
                        )}
                    </Pressable>
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
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingTop: TopTabInset,
    },
    content: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
        gap: Spacing.three,
    },
    input: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: Spacing.three,
        fontSize: 16,
    },
    section: {
        gap: Spacing.two,
    },
    wrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
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
});