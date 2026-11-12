import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// вибрација само на телефон; на web не прави ништо
const enabled = Platform.OS !== 'web';

export const haptic = {
    // лесен „клик“: копчиња, избор
    tap() {
        if (enabled) Haptics.selectionAsync().catch(() => {});
    },
    // успешна акција: join, креиран натпревар
    success() {
        if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    // грешка
    error() {
        if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
};
