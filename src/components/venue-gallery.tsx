import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { deleteVenuePhoto, photoUrl, uploadVenuePhoto } from '@/api/client';
import type { Venue } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const HEIGHT = 220;
const MAX_PHOTOS = 8;

type Props = {
    venue: Venue;
    canEdit: boolean;
    onChange: (venue: Venue) => void;
};

export function VenueGallery({ venue, canEdit, onChange }: Props) {
    const [width, setWidth] = useState(0);
    const [index, setIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const photos = venue.photoUrls;
    if (photos.length === 0 && !canEdit) {
        return null;
    }

    async function addPhoto() {
        setError(null);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (result.canceled) return;

        setBusy(true);
        try {
            onChange(await uploadVenuePhoto(venue.id, result.assets[0]));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setBusy(false);
        }
    }

    async function removePhoto(url: string) {
        setBusy(true);
        setError(null);
        try {
            const updated = await deleteVenuePhoto(venue.id, url);
            setIndex(0);
            onChange(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={styles.wrapper}>
            <ThemedView
                type="backgroundElement"
                style={styles.frame}
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
                {photos.length === 0 ? (
                    <View style={styles.empty}>
                        <ThemedText style={styles.emptyIcon}>📷</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            Add the first photo of your venue
                        </ThemedText>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScroll={(e) => width && setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
                        {photos.map((url) => (
                            <View key={url} style={{ width, height: HEIGHT }}>
                                <Image source={{ uri: photoUrl(url) }} style={styles.photo} contentFit="cover" transition={200} />
                                {canEdit && (
                                    <Pressable
                                        onPress={() => removePhoto(url)}
                                        disabled={busy}
                                        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
                                        <ThemedText style={styles.removeText}>✕</ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}

                {photos.length > 1 && (
                    <View style={styles.dots}>
                        {photos.map((url, i) => (
                            <View key={url} style={[styles.dot, i === index && styles.dotActive]} />
                        ))}
                    </View>
                )}

                {photos.length > 0 && (
                    <View style={styles.counter}>
                        <ThemedText style={styles.counterText}>
                            {Math.min(index + 1, photos.length)}/{photos.length}
                        </ThemedText>
                    </View>
                )}

                {busy && (
                    <View style={styles.overlay}>
                        <ActivityIndicator color="#ffffff" />
                    </View>
                )}
            </ThemedView>

            {canEdit && photos.length < MAX_PHOTOS && (
                <Pressable
                    onPress={addPhoto}
                    disabled={busy}
                    style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                    <ThemedText type="smallBold" style={styles.addText}>
                        + Add photo ({photos.length}/{MAX_PHOTOS})
                    </ThemedText>
                </Pressable>
            )}

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: Spacing.two,
    },
    frame: {
        height: HEIGHT,
        borderRadius: Spacing.three,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.one,
    },
    emptyIcon: {
        fontSize: 32,
        lineHeight: 40,
    },
    dots: {
        position: 'absolute',
        bottom: Spacing.two,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        width: 18,
        backgroundColor: '#ffffff',
    },
    counter: {
        position: 'absolute',
        top: Spacing.two,
        left: Spacing.two,
        paddingHorizontal: Spacing.two,
        borderRadius: Spacing.two,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    counterText: {
        color: '#ffffff',
        fontSize: 12,
        lineHeight: 20,
        fontWeight: 600,
    },
    remove: {
        position: 'absolute',
        top: Spacing.two,
        right: Spacing.two,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    removeText: {
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 18,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    addButton: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#3c87f7',
        borderRadius: Spacing.three,
        paddingVertical: Spacing.two,
        alignItems: 'center',
    },
    addText: {
        color: '#3c87f7',
    },
    error: {
        color: '#e5484d',
    },
    pressed: {
        opacity: 0.7,
    },
});