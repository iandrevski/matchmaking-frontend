// Types that match the backend DTOs (sportify.matchmakingbackend.dto)

export type Sport = {
    id: number;
    name: string;
    numberOfPlayers: number;
};

export type MatchStatus = 'OPEN' | 'FULL' | 'FINISHED' | 'CANCELLED';

export type Match = {
    id: number;
    dateFrom: string; // ISO string, e.g. "2026-10-16T18:00:00"
    dateTo: string;
    status: MatchStatus;
    sport: Sport;
    venueId: number;
    venueName: string;
    organizerId: number | null;
    organizerUsername: string | null;
    participantsCount: number;
    participantIds: number[];
};

export type Venue = {
    id: number;
    name: string;
    city: string | null;
    municipality: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    ownerId: number;
    sports: Sport[];
};

// error format from the backend's GlobalExceptionHandler
export type ApiError = {
    status: number;
    error: string;
    message: string;
    fieldErrors: Record<string, string>;
    timestamp: string;
};

export type CreateMatchRequest = {
    dateFrom: string; // локално време без Z, пр. "2026-10-21T18:00:00"
    dateTo: string;
    sportId: number;
    venueId: number;
};

export type Player = {
    id: number;
    username: string;
    email: string;
    age: number | null;
    height: number | null;
    weight: number | null;
    homeLat: number | null;
    homeLong: number | null;
};

export type Role = 'ROLE_USER' | 'ROLE_OWNER' | 'ROLE_ADMIN';

export type User = {
    id: number;
    username: string;
    email: string;
    role: Role;
};

export type AuthResponse = {
    token: string;
    user: User;
};

export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
};