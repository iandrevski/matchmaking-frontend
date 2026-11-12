import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportPlayer } from '@/api/client';
import type { ReportReason } from '@/api/types';
import { avatarColor } from '@/components/player-lineup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ReasonOption = { value: ReportReason; emoji: string; label: string; placeholder: string };

const REASONS: ReasonOption[] = [
  { value: 'NO_SHOW', emoji: '👻', label: 'Didn’t show up', placeholder: 'Did they let anyone know?' },
  { value: 'LATE', emoji: '⏰', label: 'Came very late', placeholder: 'Roughly how late were they?' },
  { value: 'ABUSIVE_LANGUAGE', emoji: '🗯️', label: 'Rude or insulting', placeholder: 'What did they say?' },
  { value: 'AGGRESSIVE_BEHAVIOR', emoji: '⚠️', label: 'Aggressive play', placeholder: 'What happened on the court?' },
  { value: 'CHEATING', emoji: '🎭', label: 'Unfair play', placeholder: 'How did they cheat?' },
  { value: 'SPAM', emoji: '📢', label: 'Spam in chat', placeholder: 'What were they posting?' },
  { value: 'OTHER', emoji: '💬', label: 'Something else', placeholder: 'Tell us what happened' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  playerId: number;
  username: string;
  matchId?: number; // натпреварот од кој е отворен профилот, ако го има
};

export function ReportPlayerSheet({ visible, onClose, playerId, username, matchId }: Props) {
  const theme = useTheme();
  const [reason, setReason] = useState<ReasonOption | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDetails = reason?.value === 'OTHER';
  const canSubmit = reason !== null && (!needsDetails || details.trim() !== '') && !sending;

  function close() {
    onClose();
    // формата се чисти по затворањето, за следниот пат да е празна
    setReason(null);
    setDetails('');
    setSent(false);
    setError(null);
  }

  async function submit() {
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      await reportPlayer(playerId, {
        reason: reason.value,
        details: details.trim() || null,
        matchId: matchId ?? null,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <ThemedView style={styles.sheet}>
          <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
          <SafeAreaView edges={['bottom']}>
            {sent ? (
              <View style={styles.done}>
                <View style={[styles.doneCircle, { backgroundColor: theme.tintSoft }]}>
                  <ThemedText themeColor="tint" style={styles.doneCheck}>
                    ✓
                  </ThemedText>
                </View>
                <ThemedText style={styles.doneTitle}>Thanks for telling us</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.center}>
                  Our team will look into it carefully. {username} won&apos;t know it was you.
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  Thanks for helping keep Sportify friendly 💚
                </ThemedText>
                <Pressable
                  onPress={close}
                  style={({ pressed }) => [styles.primary, styles.stretch, pressed && styles.primaryPressed]}>
                  <ThemedText style={styles.primaryText}>Done</ThemedText>
                </Pressable>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* кого пријавуваш */}
                <View style={styles.header}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(username) }]}>
                    <ThemedText style={styles.avatarText}>{username.charAt(0).toUpperCase()}</ThemedText>
                  </View>
                  <View style={styles.flex}>
                    <ThemedText style={styles.title}>Problem with {username}?</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      It stays private. They won&apos;t know who reported them.
                    </ThemedText>
                  </View>
                </View>

                {/* што се случило */}
                <ThemedText type="smallBold" style={styles.label}>
                  What happened?
                </ThemedText>
                <View style={styles.grid}>
                  {REASONS.map((item) => {
                    const selected = reason?.value === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        onPress={() => setReason(item)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
                        <View
                          style={[
                            styles.reason,
                            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                            selected && { backgroundColor: theme.tintSoft, borderColor: Brand.primary },
                          ]}>
                          <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
                          <ThemedText type={selected ? 'smallBold' : 'small'} style={styles.flex} numberOfLines={2}>
                            {item.label}
                          </ThemedText>
                          {selected && (
                            <View style={styles.tick}>
                              <ThemedText style={styles.tickText}>✓</ThemedText>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* детали: се појавуваат кога ќе избереш причина */}
                {reason && (
                  <View style={styles.detailsBlock}>
                    <ThemedText type="smallBold" style={styles.label}>
                      {needsDetails ? 'Tell us a bit more' : 'Anything else? (optional)'}
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      ]}
                      placeholder={reason.placeholder}
                      placeholderTextColor={theme.textSecondary}
                      value={details}
                      onChangeText={setDetails}
                      maxLength={1000}
                      multiline
                    />
                    <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
                      {details.length}/1000
                    </ThemedText>
                  </View>
                )}

                {error && (
                  <View style={styles.errorBox}>
                    <ThemedText type="small" style={styles.errorText}>
                      {error}
                    </ThemedText>
                  </View>
                )}

                <Pressable
                  onPress={submit}
                  disabled={!canSubmit}
                  style={({ pressed }) => [styles.primary, !canSubmit && styles.disabled, pressed && styles.primaryPressed]}>
                  {sending ? (
                    <ActivityIndicator color={Brand.onPrimary} />
                  ) : (
                    <ThemedText style={styles.primaryText}>Send report</ThemedText>
                  )}
                </Pressable>
                <Pressable onPress={close} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Never mind
                  </ThemedText>
                </Pressable>
              </ScrollView>
            )}
          </SafeAreaView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(5,20,12,0.5)',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  label: {
    marginTop: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
  },
  cell: {
    width: '50%',
    padding: Spacing.one,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 58,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: {
    color: Brand.onPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  detailsBlock: {
    gap: Spacing.two,
  },
  input: {
    fontFamily: FontFamily.medium,
    minHeight: 96,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: 14,
    backgroundColor: 'rgba(214,69,69,0.12)',
  },
  errorText: {
    color: Brand.danger,
  },
  primary: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.primary,
    marginTop: Spacing.two,
  },
  primaryPressed: {
    backgroundColor: Brand.primaryPressed,
  },
  primaryText: {
    color: Brand.onPrimary,
    fontWeight: 700,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  secondary: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.4,
  },
  done: {
    padding: Spacing.five,
    paddingTop: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  doneCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  doneCheck: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: 700,
  },
  doneTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
