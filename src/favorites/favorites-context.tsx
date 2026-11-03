import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
    addFavoriteMatch,
    addFavoriteVenue,
    getFavorites,
    removeFavoriteMatch,
    removeFavoriteVenue,
} from '@/api/client';
import type { Favorites } from '@/api/types';
import { useAuth } from '@/auth/auth-context';

const EMPTY: Favorites = { venues: [], matches: [] };

type FavoritesContextValue = Favorites & {
    isFavoriteVenue: (id: number) => boolean;
    isFavoriteMatch: (id: number) => boolean;
    toggleVenue: (id: number) => Promise<void>;
    toggleMatch: (id: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const isPlayer = user?.role === 'ROLE_USER';
    const [favorites, setFavorites] = useState<Favorites>(EMPTY);

    // се вчитуваат при најава; партнерите немаат омилени
    useEffect(() => {
        if (!isPlayer) {
            setFavorites(EMPTY);
            return;
        }
        getFavorites().then(setFavorites).catch(() => setFavorites(EMPTY));
    }, [isPlayer, user?.id]);

    const isFavoriteVenue = useCallback(
        (id: number) => favorites.venues.some((v) => v.id === id),
        [favorites],
    );
    const isFavoriteMatch = useCallback(
        (id: number) => favorites.matches.some((m) => m.id === id),
        [favorites],
    );

    // backend-от ја враќа целата нова листа, па нема разминување
    const toggleVenue = useCallback(
        async (id: number) => {
            setFavorites(await (isFavoriteVenue(id) ? removeFavoriteVenue(id) : addFavoriteVenue(id)));
        },
        [isFavoriteVenue],
    );
    const toggleMatch = useCallback(
        async (id: number) => {
            setFavorites(await (isFavoriteMatch(id) ? removeFavoriteMatch(id) : addFavoriteMatch(id)));
        },
        [isFavoriteMatch],
    );

    const value = useMemo(
        () => ({ ...favorites, isFavoriteVenue, isFavoriteMatch, toggleVenue, toggleMatch }),
        [favorites, isFavoriteVenue, isFavoriteMatch, toggleVenue, toggleMatch],
    );

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used inside <FavoritesProvider>');
    }
    return context;
}