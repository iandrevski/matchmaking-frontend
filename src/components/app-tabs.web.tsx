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
import { SportIcon } from '@/components/ui/icon';

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

// ref не се проследува: типот на Pressable во SDK 58 не се совпаѓа со ref-от од TabTrigger
export function TabButton({ children, isFocused, ref: _ref, ...props }: TabTriggerSlotProps) {
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
          <View style={styles.brandText}>
            <SportIcon sport="football" size={18} color={Brand.primary} />
            <ThemedText type="smallBold" themeColor="tint">
              Sportify
            </ThemedText>
          </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
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