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
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomTabInset, Brand, FontFamily, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLabel, formatDayTime, formatTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';

const POLL_MS = 3000;

// нови пораки се додаваат без дупликати (иста порака може да дојде од праќање и од polling)
function merge(current: Message[], incoming: Message[]) {
    const known = new Set(current.map((m) => m.id));
    return [...current, ...incoming.filter((m) => !known.has(m.id))];
}

function sameDay(a: string, b: string) {
    return new Date(a).toDateString() === new Date(b).toDateString();
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
        haptic.tap();
        setSending(true);
        try {
            const sent = await sendMessage(matchId, body);
            setText('');
            // lastId не се менува: ако некој друг пишал во меѓувреме, polling-от ќе ја земе и неговата
            setMessages((current) => merge(current, [sent]));
            setError(null);
        } catch (e) {
            haptic.error();
            setError(e instanceof Error ? e.message : 'Could not send');
        } finally {
            setSending(false);
        }
    }

    // inverted листа: најновата порака е долу, до полето за пишување
    const reversed = [...messages].reverse();
    const canSend = text.trim() !== '' && !sending;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <ScreenHeader
                            title="Lobby chat"
                            subtitle={match ? `${match.sport.name} · ${match.venueName} · ${formatDayTime(match.dateFrom)}` : undefined}
                            fallback={{ pathname: '/matches/[id]', params: { id: matchId } }}
                        />
                    </View>

                    {loading ? (
                        <View style={styles.skeleton}>
                            <Skeleton width="55%" height={44} radius={20} />
                            <Skeleton width="40%" height={44} radius={20} style={styles.skeletonMine} />
                            <Skeleton width="65%" height={60} radius={20} />
                        </View>
                    ) : messages.length === 0 ? (
                        <View style={styles.empty}>
                            <EmptyState
                                icon="message-circle"
                                title="No messages yet"
                                text="Say hi and agree on the details: shirts, ball, who brings water."
                            />
                        </View>
                    ) : (
                        <FlatList
                            style={styles.flex}
                            data={reversed}
                            inverted
                            keyExtractor={(item) => String(item.id)}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => {
                                // inverted: постарата порака е index + 1, поновата index - 1
                                const older = reversed[index + 1];
                                const newer = reversed[index - 1];
                                const newDay = !older || !sameDay(older.createdAt, item.createdAt);
                                const firstOfGroup = newDay || older.senderId !== item.senderId;
                                const lastOfGroup =
                                    !newer || newer.senderId !== item.senderId || !sameDay(newer.createdAt, item.createdAt);
                                return (
                                    <View>
                                        {newDay && (
                                            <View style={styles.dayRow}>
                                                <View style={[styles.dayChip, { backgroundColor: theme.backgroundSelected }]}>
                                                    <ThemedText style={styles.dayText} themeColor="textSecondary">
                                                        {formatDayLabel(item.createdAt)}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        )}
                                        <Bubble
                                            message={item}
                                            mine={item.senderId === user?.id}
                                            firstOfGroup={firstOfGroup}
                                            lastOfGroup={lastOfGroup}
                                        />
                                    </View>
                                );
                            }}
                        />
                    )}

                    <View style={[styles.inputBar, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
                        {error && (
                            <ThemedText type="small" style={styles.error}>
                                {error}
                            </ThemedText>
                        )}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                                placeholder="Message your teammates…"
                                placeholderTextColor={theme.textSecondary}
                                value={text}
                                onChangeText={setText}
                                onSubmitEditing={onSend}
                                submitBehavior="submit"
                                returnKeyType="send"
                                maxLength={500}
                                accessibilityLabel="Message"
                            />
                            <Pressable
                                onPress={onSend}
                                disabled={!canSend}
                                accessibilityRole="button"
                                accessibilityLabel="Send message"
                                style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}>
                                {sending ? (
                                    <ActivityIndicator color={Brand.onPrimary} />
                                ) : (
                                    <Icon name="arrow-up" size={22} color={Brand.onPrimary} />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ThemedView>
    );
}

type BubbleProps = {
    message: Message;
    mine: boolean;
    firstOfGroup: boolean; // прва од низа пораки од ист човек: име
    lastOfGroup: boolean; // последна: аватар и „опашка“
};

function Bubble({ message, mine, firstOfGroup, lastOfGroup }: BubbleProps) {
    const theme = useTheme();
    const color = avatarColor(message.senderUsername);

    return (
        <View style={[styles.bubbleRow, mine && styles.bubbleRowMine, firstOfGroup && styles.groupGap]}>
            {!mine && (
                <View style={[styles.avatar, { backgroundColor: lastOfGroup ? color : 'transparent' }]}>
                    {lastOfGroup && (
                        <ThemedText style={styles.avatarText}>{message.senderUsername.charAt(0).toUpperCase()}</ThemedText>
                    )}
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    mine
                        ? [styles.bubbleMine, lastOfGroup && styles.tailMine]
                        : [{ backgroundColor: theme.backgroundElement, borderColor: theme.border }, styles.bubbleOther, lastOfGroup && styles.tailOther],
                ]}>
                {!mine && firstOfGroup && (
                    <ThemedText style={[styles.sender, { color }]}>{message.senderUsername}</ThemedText>
                )}
                <ThemedText style={[styles.body, mine && styles.mineText]}>{message.text}</ThemedText>
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
    },
    flex: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.three,
        paddingBottom: Spacing.three,
        borderBottomWidth: 1,
    },
    skeleton: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: Spacing.three,
        gap: Spacing.two,
    },
    skeletonMine: {
        alignSelf: 'flex-end',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.three,
    },
    list: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        gap: 3,
    },
    dayRow: {
        alignItems: 'center',
        marginVertical: Spacing.three,
    },
    dayChip: {
        paddingHorizontal: Spacing.three,
        height: 26,
        justifyContent: 'center',
        borderRadius: Radius.pill,
    },
    dayText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: 700,
    },
    bubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.two,
        maxWidth: '82%',
    },
    bubbleRowMine: {
        alignSelf: 'flex-end',
    },
    groupGap: {
        marginTop: Spacing.two,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: 800,
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: Spacing.two,
        borderRadius: 20,
        flexShrink: 1,
        gap: 2,
    },
    bubbleMine: {
        backgroundColor: Brand.primary,
    },
    bubbleOther: {
        borderWidth: 1,
    },
    tailMine: {
        borderBottomRightRadius: 6,
    },
    tailOther: {
        borderBottomLeftRadius: 6,
    },
    sender: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: 800,
    },
    body: {
        fontSize: 15,
        lineHeight: 21,
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
        color: 'rgba(255,255,255,0.72)',
    },
    error: {
        color: Brand.danger,
        textAlign: 'center',
    },
    inputBar: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.two,
        paddingBottom: BottomTabInset + Spacing.two,
        borderTopWidth: 1,
        gap: Spacing.one,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    input: {
        fontFamily: FontFamily.medium,
        flex: 1,
        height: 46,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.pill,
        borderWidth: 1,
        fontSize: 16,
    },
    send: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Brand.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendDisabled: {
        opacity: 0.35,
    },
    pressed: {
        opacity: 0.8,
    },
});
