import type { Match } from '@/api/types';

// натпревари што уште не почнале и не се откажани, најблиските први
export function upcoming(matches: Match[], limit?: number) {
    const now = Date.now();
    const result = matches
        .filter((m) => new Date(m.dateFrom).getTime() > now && m.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
    return limit ? result.slice(0, limit) : result;
}
// одиграни натпревари, најновите први
export function past(matches: Match[]) {
    const now = Date.now();
    return matches
        .filter((m) => m.status !== 'CANCELLED' && new Date(m.dateTo).getTime() < now)
        .sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime());
}