import type {
    ApiError,
    AuthResponse,
    CreateMatchRequest,
    Match,
    MatchStatus,
    Player,
    RegisterRequest,
    Sport, UpdatePlayerRequest,
    User,
    Venue,
} from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// токенот се чува во меморија за да не се чита од складиштето на секое барање
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

// AuthProvider го регистрира ова: ако токенот истече → автоматски logout
export function setUnauthorizedHandler(handler: (() => void) | null) {
    onUnauthorized = handler;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!API_URL) {
        throw new Error('EXPO_PUBLIC_API_URL is not set (check .env.local)');
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...options.headers,
            },
        });
    } catch {
        // мрежа: backend-от не работи, погрешна IP адреса, firewall...
        throw new Error('Cannot reach the server. Is the backend running?');
    }

    if (!response.ok) {
        if (response.status === 401 && authToken) {
            onUnauthorized?.(); // токенот истекол или е невалиден
        }

        let message = `Request failed (${response.status})`;
        try {
            const body = (await response.json()) as ApiError;
            const fields = Object.entries(body.fieldErrors ?? {});
            if (fields.length > 0) {
                message = fields.map(([field, msg]) => `${field}: ${msg}`).join('\n');
            } else if (body.message) {
                message = body.message;
            }
        } catch {
            // телото не е JSON, останува default пораката
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

// ---------- Auth ----------
export const login = (username: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

export const registerPlayer = (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register/player', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const getMe = () => apiFetch<User>('/auth/me');

// ---------- Sports ----------
export const getSports = () => apiFetch<Sport[]>('/sports');

// ---------- Venues ----------
export const getVenues = (sportId?: number) =>
    apiFetch<Venue[]>(`/venues${sportId ? `?sportId=${sportId}` : ''}`);

export const getVenue = (id: number) => apiFetch<Venue>(`/venues/${id}`);

// ---------- Matches ----------
export type MatchFilters = {
    sportId?: number | null;
    status?: MatchStatus | null;
};

export const getVenueMatches = (venueId: number) =>
    apiFetch<Match[]>(`/matches/venue/${venueId}`);

export const getMatches = (filters: MatchFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.sportId) params.append('sportId', String(filters.sportId));
    if (filters.status) params.append('status', filters.status);
    const query = params.toString();
    return apiFetch<Match[]>(`/matches${query ? `?${query}` : ''}`);
};

export const getOpenMatches = () => apiFetch<Match[]>('/matches?status=OPEN');
export const getMatch = (id: number) => apiFetch<Match>(`/matches/${id}`);

// играчот е најавениот корисник, backend-от го зема од токенот
export const joinMatch = (matchId: number) =>
    apiFetch<Match>(`/matches/${matchId}/join`, { method: 'POST' });

export const leaveMatch = (matchId: number) =>
    apiFetch<Match>(`/matches/${matchId}/leave`, { method: 'POST' });

export const createMatch = (body: CreateMatchRequest) =>
    apiFetch<Match>('/matches', {
        method: 'POST',
        body: JSON.stringify(body),
    });

// ---------- Players ----------
export const getPlayer = (id: number) => apiFetch<Player>(`/players/${id}`);
export const getPlayerMatches = (playerId: number) =>
    apiFetch<Match[]>(`/matches/player/${playerId}`);

export const getMyProfile = () => apiFetch<Player>('/players/me');

export const updateMyProfile = (body: UpdatePlayerRequest) =>
    apiFetch<Player>('/players/me', {
        method: 'PUT',
        body: JSON.stringify(body),
    });