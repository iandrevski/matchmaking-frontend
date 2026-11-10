import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatch, getMessages, sendMessage } from '@/api/client';
import type { Match, Message } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { avatarColor } from '@/components/player-lineup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMatchDate, formatTime } from '@/utils/format';
import { sportEmoji } from '@/utils/sports';

const POLL_MS = 3000;
const ACCENT = Brand.primary;

// нови пораки се додаваат без дупликати (иста порака може да дојде од праќање и од polling)
function merge(current: Message[], incoming: Message[]) {
    const known = new Set(current.map((m) => m.id));
    return [...current, ...incoming.filter((m) => !known.has(m.id))];
}

export default function MatchChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const matchId = Number(id);
    const { user } = useAuth();
    const theme = useTheme();

    const [match, setMatch] = useState<Match | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // id на последната порака што ја имаме; следното прашување бара само поновите
    const lastId = useRef<number | null>(null);

    useEffect(() => {
        getMatch(matchId).then(setMatch).catch(() => {});
    }, [matchId]);

    const poll = useCallback(async () => {
        try {
            const fresh = await getMessages(matchId, lastId.current);
            if (fresh.length > 0) {
                lastId.current = fresh[fresh.length - 1].id;
                setMessages((current) => merge(current, fresh));
            }
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load messages');
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    // прашува на секои 3 секунди, но само додека е отворен екранот
    useFocusEffect(
        useCallback(() => {
            poll();
            const timer = setInterval(poll, POLL_MS);
            return () => clearInterval(timer);
        }, [poll]),
    );

    async function onSend() {
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const sent = await sendMessage(matchId, body);
            setText('');
            // lastId не се менува: ако некој друг пишал во меѓувреме, polling-от ќе ја земе и неговата
            setMessages((current) => merge(current, [sent]));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not send');
        } finally {
            setSending(false);
        }
    }

    // inverted листа: најновата порака е долу, до полето за пишување
    const reversed = [...messages].reverse();

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">💬 Lobby</ThemedText>
                        {match && (
                            <ThemedText type="small" themeColor="textSecondary">
                                {sportEmoji(match.sport.name)} {match.sport.name} · {match.venueName} ·{' '}
                                {formatMatchDate(match.dateFrom)}
                            </ThemedText>
                        )}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" style={styles.flex} />
                    ) : messages.length === 0 ? (
                        <View style={styles.empty}>
                            <ThemedText style={styles.emptyIcon}>👋</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                                No messages yet. Say hi to your teammates!
                            </ThemedText>
                        </View>
                    ) : (
                        <FlatList
                            style={styles.flex}
                            data={reversed}
                            inverted
                            keyExtractor={(item) => String(item.id)}
                            contentContainerStyle={styles.list}
                            renderItem={({ item, index }) => {
                                // името се покажува само кога се менува испраќачот (inverted: претходната е index + 1)
                                const previous = reversed[index + 1];
                                return (
                                    <Bubble
                                        message={item}
                                        mine={item.senderId === user?.id}
                                        showName={!previous || previous.senderId !== item.senderId}
                                    />
                                );
                            }}
                        />
                    )}

                    {error && <ThemedText style={styles.error}>{error}</ThemedText>}

                    <View style={styles.inputBar}>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholder="Message your teammates…"
                            placeholderTextColor={theme.textSecondary}
                            value={text}
                            onChangeText={setText}
                            onSubmitEditing={onSend}
                            submitBehavior="submit"
                            returnKeyType="send"
                            maxLength={500}
                        />
                        <Pressable
                            onPress={onSend}
                            disabled={!text.trim() || sending}
                            accessibilityLabel="Send message"
                            style={({ pressed }) => [
                                styles.send,
                                (!text.trim() || sending) && styles.sendDisabled,
                                pressed && styles.pressed,
                            ]}>
                            {sending ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.sendIcon}>➤</ThemedText>}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ThemedView>
    );
}

function Bubble({ message, mine, showName }: { message: Message; mine: boolean; showName: boolean }) {
    const theme = useTheme();

    return (
        <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
            {!mine && (
                <View style={[styles.avatar, { backgroundColor: showName ? avatarColor(message.senderUsername) : 'transparent' }]}>
                    {showName && (
                        <ThemedText style={styles.avatarText}>{message.senderUsername.charAt(0).toUpperCase()}</ThemedText>
                    )}
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : { backgroundColor: theme.backgroundElement },
                ]}>
                {!mine && showName && (
                    <ThemedText type="smallBold" style={{ color: avatarColor(message.senderUsername) }}>
                        {message.senderUsername}
                    </ThemedText>
                )}
                <ThemedText style={mine && styles.mineText}>{message.text}</ThemedText>
                <ThemedText style={[styles.time, mine ? styles.mineTime : { color: theme.textSecondary }]}>
                    {formatTime(message.createdAt)}
                </ThemedText>
            </View>
        </View>
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
        paddingBottom: BottomTabInset,
    },
    flex: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.two,
    },
    list: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.one,
    },
    emptyIcon: {
        fontSize: 36,
        lineHeight: 44,
    },
    bubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.two,
        maxWidth: '85%',
    },
    bubbleRowMine: {
        alignSelf: 'flex-end',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 700,
    },
    bubble: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 18,
        flexShrink: 1,
    },
    bubbleMine: {
        backgroundColor: ACCENT,
        borderBottomRightRadius: 4,
    },
    mineText: {
        color: '#ffffff',
    },
    time: {
        fontSize: 10,
        lineHeight: 14,
        alignSelf: 'flex-end',
    },
    mineTime: {
        color: 'rgba(255,255,255,0.75)',
    },
    error: {
        color: '#e5484d',
        textAlign: 'center',
        paddingHorizontal: Spacing.four,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    input: {
        flex: 1,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 22,
        fontSize: 16,
    },
    send: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendDisabled: {
        opacity: 0.4,
    },
    sendIcon: {
        color: '#ffffff',
        fontSize: 18,
        lineHeight: 22,
    },
    pressed: {
        opacity: 0.8,
    },
});