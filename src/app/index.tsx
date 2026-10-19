import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches } from '@/api/client';
import type { Match } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MatchCard({ match }: { match: Match }) {
  return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{match.sport.name}</ThemedText>
        <ThemedText>{match.venueName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(match.dateFrom)}
        </ThemedText>
        <ThemedText type="small">
          {match.participantsCount}/{match.sport.numberOfPlayers} players · {match.status}
        </ThemedText>
      </ThemedView>
  );
}

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      setError(null);
      setMatches(await getMatches());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    loadMatches().finally(() => setLoading(false));
  }, [loadMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, [loadMatches]);

  return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="subtitle">Matches</ThemedText>

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          {loading ? (
              <ActivityIndicator size="large" style={styles.loader} />
          ) : (
              <FlatList
                  data={matches}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => <MatchCard match={item} />}
                  contentContainerStyle={styles.list}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                  ListEmptyComponent={
                    !error ? (
                        <ThemedText themeColor="textSecondary">No matches yet.</ThemedText>
                    ) : null
                  }
              />
          )}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  loader: {
    marginTop: Spacing.five,
  },
  error: {
    color: '#e5484d',
  },
});