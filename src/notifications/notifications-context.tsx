import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { getUnreadCount } from '@/api/client';
import { useAuth } from '@/auth/auth-context';

const POLL_MS = 30_000;

type NotificationsContextValue = {
    unreadCount: number;
    refreshUnread: () => Promise<void>;
    setUnreadCount: (count: number) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// бројот на непрочитани за ѕвончето: при најава, на секои 30 с и кога апликацијата ќе се врати во преден план
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnread = useCallback(async () => {
        if (!user) return;
        try {
            const { count } = await getUnreadCount();
            setUnreadCount(count);
        } catch {
            // ѕвончето не е критично; следниот обид ќе успее
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        refreshUnread();
        const timer = setInterval(refreshUnread, POLL_MS);
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshUnread();
        });
        return () => {
            clearInterval(timer);
            subscription.remove();
        };
    }, [user, refreshUnread]);

    const value = useMemo(
        () => ({ unreadCount, refreshUnread, setUnreadCount }),
        [unreadCount, refreshUnread],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used inside <NotificationsProvider>');
    }
    return context;
}