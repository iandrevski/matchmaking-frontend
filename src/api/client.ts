import type {
    ApiError, AppNotification,
    AuthResponse,
    CreateMatchRequest, Favorites,
    Match,
    MatchStatus, Message, MyMatchReviews,
    NearbyMatch,
    Player, PlayerReviewSummary,
    RegisterRequest, ReportRequest, ReviewInput,
    Sport,
    UpdatePlayerRequest,
    User,
    Venue,
    VenueRequest, VenueReviews, VenueStats,
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
                // за FormData (слики) Content-Type го поставува самиот fetch, со boundary
                ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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

export const registerPartner = (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register/partner', {
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

export const getMyVenues = (ownerId: number) => apiFetch<Venue[]>(`/venues?ownerId=${ownerId}`);

export const createVenue = (body: VenueRequest) =>
    apiFetch<Venue>('/venues', { method: 'POST', body: JSON.stringify(body) });

export const updateVenue = (id: number, body: VenueRequest) =>
    apiFetch<Venue>(`/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteVenue = (id: number) => apiFetch<void>(`/venues/${id}`, { method: 'DELETE' });

export const getVenueStats = (id: number) => apiFetch<VenueStats>(`/venues/${id}/stats`);

// ---------- Matches ----------
export type MatchFilters = {
    sportId?: number | null;
    venueId?: number | null;
    status?: MatchStatus | null;
    date?: string | null;
};

export const getMatches = (filters: MatchFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.sportId) params.append('sportId', String(filters.sportId));
    if (filters.venueId) params.append('venueId', String(filters.venueId));
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    const query = params.toString();
    return apiFetch<Match[]>(`/matches${query ? `?${query}` : ''}`);
};

export const getMatchDays = (
    from: string,
    to: string,
    sportId?: number | null,
    venueId?: number | null,
) => {
    const params = new URLSearchParams({ from, to });
    if (sportId) params.append('sportId', String(sportId));
    if (venueId) params.append('venueId', String(venueId));
    return apiFetch<string[]>(`/matches/days?${params.toString()}`);
};
export const getOpenMatches = () => apiFetch<Match[]>('/matches?status=OPEN');
export const getMatch = (id: number) => apiFetch<Match>(`/matches/${id}`);

export const getVenueMatches = (venueId: number) =>
    apiFetch<Match[]>(`/matches/venue/${venueId}`);

export const getNearbyMatches = (lat: number, lng: number, radiusKm: number) =>
    apiFetch<NearbyMatch[]>(`/matches/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);

// играчот е најавениот корисник, backend-от го зема од токенот
export const joinMatch = (matchId: number) =>
    apiFetch<Match>(`/matches/${matchId}/join`, { method: 'POST' });

export const leaveMatch = (matchId: number) =>
    apiFetch<Match>(`/matches/${matchId}/leave`, { method: 'POST' });

export const cancelMatch = (matchId: number) =>
    apiFetch<Match>(`/matches/${matchId}/cancel`, { method: 'POST' });

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

export const updateMyLocation = (lat: number, lng: number) =>
    apiFetch<Player>('/players/me/location', {
        method: 'PUT',
        body: JSON.stringify({ lat, lng }),
    });

// ---------- Photos ----------
// "/uploads/venues/x.jpg" → целосна адреса на серверот
export function photoUrl(path: string) {
    return `${(API_URL ?? '').replace(/\/api$/, '')}${path}`;
}

type PickedPhoto = { uri: string; mimeType?: string | null; fileName?: string | null; file?: File };

export function uploadVenuePhoto(venueId: number, photo: PickedPhoto) {
    const form = new FormData();
    if (photo.file) {
        form.append('file', photo.file); // web: вистински File
    } else {
        // телефон: React Native го праќа фајлот од uri
        form.append('file', {
            uri: photo.uri,
            name: photo.fileName ?? 'photo.jpg',
            type: photo.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
    }
    return apiFetch<Venue>(`/venues/${venueId}/photos`, { method: 'POST', body: form });
}

export function deleteVenuePhoto(venueId: number, url: string) {
    const fileName = url.split('/').pop();
    return apiFetch<Venue>(`/venues/${venueId}/photos/${fileName}`, { method: 'DELETE' });
}

// ---------- Favorites ----------
export const getFavorites = () => apiFetch<Favorites>('/players/me/favorites');

export const addFavoriteVenue = (venueId: number) =>
    apiFetch<Favorites>(`/players/me/favorites/venues/${venueId}`, { method: 'PUT' });

export const removeFavoriteVenue = (venueId: number) =>
    apiFetch<Favorites>(`/players/me/favorites/venues/${venueId}`, { method: 'DELETE' });

export const addFavoriteMatch = (matchId: number) =>
    apiFetch<Favorites>(`/players/me/favorites/matches/${matchId}`, { method: 'PUT' });

export const removeFavoriteMatch = (matchId: number) =>
    apiFetch<Favorites>(`/players/me/favorites/matches/${matchId}`, { method: 'DELETE' });

// ---------- Reviews ----------
export const getMyMatchReviews = (matchId: number) =>
    apiFetch<MyMatchReviews>(`/matches/${matchId}/reviews/mine`);

export const submitMatchReviews = (matchId: number, body: ReviewInput) =>
    apiFetch<MyMatchReviews>(`/matches/${matchId}/reviews`, { method: 'PUT', body: JSON.stringify(body) });

export const getPlayerReviewSummary = (playerId: number) =>
    apiFetch<PlayerReviewSummary>(`/players/${playerId}/reviews/summary`);

export const getVenueReviews = (venueId: number) => apiFetch<VenueReviews>(`/venues/${venueId}/reviews`);

// ---------- Chat ----------
// after = id на последната порака што ја имаме; без него → последните 50
export const getMessages = (matchId: number, after?: number | null) =>
    apiFetch<Message[]>(`/matches/${matchId}/messages${after ? `?after=${after}` : ''}`);

export const sendMessage = (matchId: number, text: string) =>
    apiFetch<Message>(`/matches/${matchId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });

// ---------- Notifications ----------
export const getNotifications = () => apiFetch<AppNotification[]>('/notifications');

export const getUnreadCount = () => apiFetch<{ count: number }>('/notifications/unread-count');

export const markNotificationRead = (id: number) =>
    apiFetch<AppNotification>(`/notifications/${id}/read`, { method: 'POST' });

export const markAllNotificationsRead = () =>
    apiFetch<{ count: number }>('/notifications/read-all', { method: 'POST' });

// ---------- Reports ----------
export const reportPlayer = (playerId: number, body: ReportRequest) =>
    apiFetch<void>(`/players/${playerId}/reports`, { method: 'POST', body: JSON.stringify(body) });