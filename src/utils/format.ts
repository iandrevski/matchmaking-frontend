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

// Date → "2026-10-21T18:00:00" (локално време, без Z, како што очекува backend-от)
export function toLocalIsoString(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
    );
}