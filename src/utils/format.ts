export function formatMatchDate(iso: string, variant: 'short' | 'long' = 'short') {
    return new Date(iso).toLocaleString(undefined, {
        weekday: variant,
        day: 'numeric',
        month: variant,
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}