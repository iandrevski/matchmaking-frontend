import type { ApiError, Match, Sport, Venue } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
                ...options.headers,
            },
        });
    } catch {
        // network: backend not running, wrong IP, firewall...
        throw new Error('Cannot reach the server. Is the backend running?');
    }

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = (await response.json()) as ApiError;
            if (body.message) message = body.message;
        } catch {
            // the body isn't JSON, keep the default message
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

// ---------- Sports ----------
export const getSports = () => apiFetch<Sport[]>('/sports');

// ---------- Venues ----------
export const getVenues = () => apiFetch<Venue[]>('/venues');
export const getVenue = (id: number) => apiFetch<Venue>(`/venues/${id}`);

// ---------- Matches ----------
export const getMatches = () => apiFetch<Match[]>('/matches');
export const getOpenMatches = () => apiFetch<Match[]>('/matches?status=OPEN');
export const getMatch = (id: number) => apiFetch<Match>(`/matches/${id}`);

// TODO (auth): playerId will come from the token, not as a parameter
export const joinMatch = (matchId: number, playerId: number) =>
    apiFetch<Match>(`/matches/${matchId}/join?playerId=${playerId}`, { method: 'POST' });

export const leaveMatch = (matchId: number, playerId: number) =>
    apiFetch<Match>(`/matches/${matchId}/leave?playerId=${playerId}`, { method: 'POST' });