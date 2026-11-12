import { Feather } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
    const { user } = useAuth();
    const isPartner = user?.role === 'ROLE_OWNER';

    return (
        <NativeTabs
            backgroundColor={colors.backgroundElement}
            tintColor={colors.tint}
            indicatorColor={colors.tintSoft}
            labelStyle={{ selected: { color: colors.tint } }}>
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Feather} name="home" />} />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="venues">
                <NativeTabs.Trigger.Label>Venues</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Feather} name="map-pin" />} />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="matches" hidden={isPartner}>
                <NativeTabs.Trigger.Label>Matches</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Feather} name="calendar" />} />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile" hidden={isPartner}>
                <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Feather} name="user" />} />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
