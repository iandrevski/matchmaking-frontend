const SPORT_EMOJI: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    volleyball: '🏐',
    handball: '🤾',
    'table tennis': '🏓',
};

export function sportEmoji(sportName: string) {
    return SPORT_EMOJI[sportName.toLowerCase()] ?? '🏅';
}