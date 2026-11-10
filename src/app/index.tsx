import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMatches, getPlayerMatches, getSports } from '@/api/client';
import type { Match, Sport } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { MatchCard } from '@/components/match-card';
import { NearbyMatches } from '@/components/nearby-matches';
import { NotificationBell } from '@/components/notification-bell';
import { PartnerHome } from '@/components/partner-home';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { upcoming } from '@/utils/matches';
import { sportEmoji } from '@/utils/sports';

// различен Home според улогата
export default function HomeScreen() {
  const { user } = useAuth();
  return user?.role === 'ROLE_OWNER' ? <PartnerHome /> : <PlayerHome />;
}

// поздрав според времето од денот
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function PlayerHome() {
  const { user } = useAuth();
  const theme = useTheme();
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
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  const nextMatch = myMatches[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}>
          {/* hero: поздрав + главни акции */}
          <Card variant="dark" style={styles.hero}>
            <View style={styles.heroTop}>
              <ThemedText style={styles.brand}>⚽ Sportify</ThemedText>
              <NotificationBell onDark />
            </View>

            <View>
              <ThemedText style={styles.heroHello}>{greeting()},</ThemedText>
              <ThemedText style={styles.heroName} numberOfLines={1}>
                {user?.username}
              </ThemedText>
              <ThemedText style={styles.heroSub}>
                {nextMatch
                  ? `You have ${myMatches.length} upcoming ${myMatches.length === 1 ? 'match' : 'matches'}.`
                  : 'Ready for a game today?'}
              </ThemedText>
            </View>

            <View style={styles.heroActions}>
              <PillButton
                label="+ Create a match"
                variant="accent"
                onPress={() => router.push('/matches/new')}
                style={styles.flex}
              />
              <PillButton
                label="Find a match"
                variant="outlineLight"
                onPress={() => router.push('/matches')}
                style={styles.flex}
              />
            </View>
          </Card>

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          {/* спортови: хоризонтални пилули */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sports}>
            {sports.map((sport) => (
              <Pressable
                key={sport.id}
                onPress={() => router.push({ pathname: '/matches', params: { sportId: sport.id } })}
                style={({ pressed }) => [
                  styles.sportPill,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.sportEmoji}>{sportEmoji(sport.name)}</ThemedText>
                <ThemedText type="smallBold">{sport.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* мои натпревари */}
          <Section title="Your upcoming matches">
            {myMatches.length === 0 ? (
              <Card style={styles.empty}>
                <ThemedText style={styles.emptyEmoji}>🏟️</ThemedText>
                <ThemedText type="smallBold">No games planned yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  Join an open match below or create your own.
                </ThemedText>
              </Card>
            ) : (
              myMatches.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </Section>

          {/* близу тебе */}
          <Card>
            <NearbyMatches />
          </Card>

          {/* отворени натпревари */}
          <Section
            title="Open matches"
            action={
              <Link href="/matches" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText type="smallBold" themeColor="tint">
                    See all
                  </ThemedText>
                </Pressable>
              </Link>
            }>
            {openMatches.length === 0 ? (
              <Card style={styles.empty}>
                <ThemedText style={styles.emptyEmoji}>🙌</ThemedText>
                <ThemedText type="smallBold">No open matches right now</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  Be the first. Create one and others will join.
                </ThemedText>
              </Card>
            ) : (
              openMatches.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  hero: {
    gap: Spacing.four,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: Brand.onDark,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  heroHello: {
    color: Brand.onDarkMuted,
    fontSize: 18,
    lineHeight: 24,
  },
  heroName: {
    color: Brand.onDark,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: 700,
  },
  heroSub: {
    color: Brand.onDarkMuted,
    marginTop: Spacing.one,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  error: {
    color: Brand.danger,
  },
  sports: {
    gap: Spacing.two,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sportEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.8,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  emptyEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  center: {
    textAlign: 'center',
  },
});
