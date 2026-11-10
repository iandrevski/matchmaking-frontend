import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useAuth } from '@/auth/auth-context';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const { user } = useAuth();
  const isPartner = user?.role === 'ROLE_OWNER';

  return (
      <Tabs>
        <TabSlot style={{ height: '100%' }} />
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="home" href="/" asChild>
              <TabButton>Home</TabButton>
            </TabTrigger>
            <TabTrigger name="venues" href="/venues" asChild>
              <TabButton>Venues</TabButton>
            </TabTrigger>
            {!isPartner && (
                <TabTrigger name="matches" href="/matches" asChild>
                  <TabButton>Matches</TabButton>
                </TabTrigger>
            )}
            {!isPartner && (
                <TabTrigger name="profile" href="/profile" asChild>
                  <TabButton>Profile</TabButton>
                </TabTrigger>
            )}
          </CustomTabList>
        </TabList>
      </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
      <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView
            type="backgroundElement"
            style={[styles.tabButtonView, isFocused && styles.tabButtonFocused]}>
          <ThemedText
              type={isFocused ? 'smallBold' : 'small'}
              themeColor="textSecondary"
              style={isFocused && styles.tabTextFocused}>
            {children}
          </ThemedText>
        </ThemedView>
      </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
      <View {...props} style={styles.tabListContainer}>
        <ThemedView type="backgroundElement" style={styles.innerContainer}>
          <ThemedText type="smallBold" themeColor="tint" style={styles.brandText}>
            ⚽ Sportify
          </ThemedText>

          {props.children}
        </ThemedView>
      </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonFocused: {
    backgroundColor: Brand.primary,
  },
  tabTextFocused: {
    color: Brand.onPrimary,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
});