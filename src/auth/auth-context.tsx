import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
    getMe,
    login as apiLogin,
    registerPartner,
    registerPlayer,
    setAuthToken,
    setUnauthorizedHandler,
} from '@/api/client';
import type { AuthResponse, RegisterRequest, User } from '@/api/types';
import { clearToken, loadToken, saveToken } from '@/auth/token-storage';

type AccountType = 'player' | 'partner';

type AuthContextValue = {
    user: User | null;
    loading: boolean; // додека се проверува зачуваниот токен при стартување
    login: (username: string, password: string) => Promise<void>;
    register: (body: RegisterRequest, accountType: AccountType) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        setAuthToken(null);
        setUser(null);
        await clearToken();
    }, []);

    // ако backend-от врати 401 за наш токен → одјави
    useEffect(() => {
        setUnauthorizedHandler(() => {
            logout();
        });
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    // при стартување: ако има зачуван токен, провери дали уште важи
    useEffect(() => {
        (async () => {
            try {
                const token = await loadToken();
                if (token) {
                    setAuthToken(token);
                    setUser(await getMe());
                }
            } catch {
                setAuthToken(null);
                await clearToken();
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const startSession = useCallback(async ({ token, user }: AuthResponse) => {
        setAuthToken(token);
        await saveToken(token);
        setUser(user);
    }, []);

    const login = useCallback(
        async (username: string, password: string) => startSession(await apiLogin(username, password)),
        [startSession],
    );

    const register = useCallback(
        async (body: RegisterRequest, accountType: AccountType) =>
            startSession(await (accountType === 'partner' ? registerPartner(body) : registerPlayer(body))),
        [startSession],
    );

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return context;
}