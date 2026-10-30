import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
    const { user } = useAuth();
    const isPartner = user?.role === 'ROLE_OWNER';

    return (
        <NativeTabs
            backgroundColor={colors.background}
            indicatorColor={colors.backgroundElement}
            labelStyle={{ selected: { color: colors.text } }}>
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/home.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="venues">
                <NativeTabs.Trigger.Label>Venues</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/explore.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="matches" hidden={isPartner}>
                <NativeTabs.Trigger.Label>Matches</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/explore.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile" hidden={isPartner}>
                <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/home.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}