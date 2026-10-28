import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches, getPlayer, getPlayerMatches, getSports } from '@/api/client';
import type { Match, Player, Sport } from '@/api/types';
import { MatchCard } from '@/components/match-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { upcoming } from '@/utils/matches';
import { sportEmoji } from '@/utils/sports';

import { useAuth } from '@/auth/auth-context';



export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [openMatches, setOpenMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const [mine, open, allSports] = await Promise.all([
        getPlayerMatches(user.id),
        getMatches({ status: 'OPEN' }),
        getSports(),
      ]);
      setMyMatches(upcoming(mine, 3));
      // „отворени“ = оние каде што уште не си, за да не се повторуваат со „мои“
      setOpenMatches(upcoming(open.filter((m) => !m.participantIds.includes(user.id)), 3));
      setSports(allSports);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [user]);

  useFocusEffect(
      useCallback(() => {
        load().finally(() => setLoading(false));
      }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" />
        </ThemedView>
    );
  }

  return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
              contentContainerStyle={styles.content}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            {/* поздрав + одјава */}
            <View style={styles.greeting}>
              <View>
                <ThemedText type="subtitle">Hi, {user?.username} 👋</ThemedText>
                <ThemedText themeColor="textSecondary">Ready for a game?</ThemedText>
              </View>
              <Pressable onPress={logout} style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" style={styles.link}>
                  Log out
                </ThemedText>
              </Pressable>
            </View>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            {/* главна акција */}
            <Link href="/matches/new" asChild>
              <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
                <ThemedText style={styles.ctaText}>+ Create a match</ThemedText>
              </Pressable>
            </Link>

            {/* мои натпревари */}
            <Section title="My upcoming matches">
              {myMatches.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    You haven&apos;t joined any upcoming matches yet.
                  </ThemedText>
              ) : (
                  myMatches.map((m) => <MatchCard key={m.id} match={m} />)
              )}
            </Section>

            {/* спортови */}
            <Section title="Browse by sport">
              <View style={styles.sportGrid}>
                {sports.map((sport) => (
                    <Pressable
                        key={sport.id}
                        style={({ pressed }) => [styles.sportTileWrap, pressed && styles.pressed]}
                        onPress={() =>
                            router.push({ pathname: '/matches', params: { sportId: sport.id } })
                        }>
                      <ThemedView type="backgroundElement" style={styles.sportTile}>
                        <ThemedText style={styles.sportEmoji}>{sportEmoji(sport.name)}</ThemedText>
                        <ThemedText type="small" numberOfLines={1}>
                          {sport.name}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                ))}
              </View>
            </Section>

            {/* отворени натпревари */}
            <Section
                title="Open matches"
                action={
                  <Link href="/matches" asChild>
                    <Pressable>
                      <ThemedText type="small" style={styles.link}>
                        See all →
                      </ThemedText>
                    </Pressable>
                  </Link>
                }>
              {openMatches.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No open matches right now. Create one!
                  </ThemedText>
              ) : (
                  openMatches.map((m) => <MatchCard key={m.id} match={m} />)
              )}
            </Section>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
  );
}

function Section({
                   title,
                   action,
                   children,
                 }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {action}
        </View>
        {children}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  error: {
    color: '#e5484d',
  },
  cta: {
    backgroundColor: '#3c87f7',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.8,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    color: '#3c87f7',
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sportTileWrap: {
    width: '31%',
  },
  sportTile: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  sportEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});