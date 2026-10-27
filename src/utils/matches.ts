import type { Match } from '@/api/types';

// натпревари што уште не почнале и не се откажани, најблиските први
export function upcoming(matches: Match[], limit?: number) {
    const now = Date.now();
    const result = matches
        .filter((m) => new Date(m.dateFrom).getTime() > now && m.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
    return limit ? result.slice(0, limit) : result;
}