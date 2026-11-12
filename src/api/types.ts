// Types that match the backend DTOs (sportify.matchmakingbackend.dto)

export type Sport = {
    id: number;
    name: string;
    numberOfPlayers: number;
};

export type MatchStatus = 'OPEN' | 'FULL' | 'FINISHED' | 'CANCELLED';

export type Participant = {
    id: number;
    username: string;
};

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
    participants: Participant[];
};

export type Venue = {
    id: number;
    name: string;
    city: string | null;
    municipality: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    pricePerHour: number | null;
    photoUrls: string[];
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

export type UpdatePlayerRequest = {
    age: number | null;
    height: number | null;
    weight: number | null;
    homeLat: number | null;
    homeLong: number | null;
};

export type VenueRequest = {
    name: string;
    city: string | null;
    municipality: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    pricePerHour: number | null;
    sportIds: number[];
};

export type NearbyMatch = {
    match: Match;
    distanceKm: number;
};

export type CountItem = {
    label: string;
    count: number;
};

export type VenueStats = {
    totalMatches: number;
    upcomingMatches: number;
    finishedMatches: number;
    cancelledMatches: number;
    totalPlayers: number;
    uniquePlayers: number;
    fillRatePercent: number;
    bookedHours: number;
    bookedValue: number | null;
    bySport: CountItem[];
    byHour: CountItem[];
    byWeekday: CountItem[];
};

export type Favorites = {
    venues: Venue[];
    matches: Match[];
};



// ---------- Оценки ----------
export type ReviewTag = 'ON_TIME' | 'GOOD_TEAMMATE' | 'FAIR_PLAY' | 'SKILLED';

export type MyMatchReviews = {
    canReview: boolean;
    reviewableUntil: string;
    players: { playerId: number; stars: number; tags: ReviewTag[] }[];
    venue: { stars: number; comment: string | null } | null;
};

export type ReviewInput = {
    players: { playerId: number; stars: number; tags: ReviewTag[] }[];
    venue: { stars: number; comment: string | null } | null;
};

export type PlayerReviewSummary = {
    playerId: number;
    username: string;
    reviewCount: number;
    averageStars: number | null; // null додека нема доволно оценки → „New player“
    tags: { tag: ReviewTag; count: number }[];
    matchesPlayed: number;
};

export type VenueReviews = {
    averageStars: number | null;
    reviewCount: number;
    reviews: { id: number; author: string; stars: number; comment: string | null; date: string }[];
};
// ---------- Chat ----------
export type Message = {
    id: number;
    senderId: number;
    senderUsername: string;
    text: string;
    createdAt: string;
};
// ---------- Notifications ----------
export type NotificationType =
    | 'PLAYER_JOINED'
    | 'MATCH_FULL'
    | 'MATCH_CANCELLED'
    | 'MATCH_REMINDER'
    | 'REVIEW_REQUEST'
    | 'NEW_MESSAGE';

// AppNotification, бидејќи "Notification" веќе постои во browser-от
export type AppNotification = {
    id: number;
    type: NotificationType;
    title: string;
    body: string;
    matchId: number | null;
    count: number;
    read: boolean;
    createdAt: string;
};

// ---------- Reports ----------
export type ReportReason =
    | 'NO_SHOW'
    | 'LATE'
    | 'ABUSIVE_LANGUAGE'
    | 'AGGRESSIVE_BEHAVIOR'
    | 'CHEATING'
    | 'SPAM'
    | 'OTHER';

export type ReportRequest = {
    reason: ReportReason;
    details: string | null;
    matchId: number | null;
};