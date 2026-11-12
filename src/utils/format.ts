export function formatMatchDate(iso: string, variant: 'short' | 'long' = 'short') {
    return new Date(iso).toLocaleString(undefined, {
        weekday: variant,
        day: 'numeric',
        month: variant,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Date → "2026-10-21T18:00:00" (локално време, без Z, како што очекува backend-от)
export function toLocalIsoString(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
    );


}

// "Jane Sandanski 1, Aerodrom, Skopje" (ги прескокнува празните делови)
export function formatAddress(venue: { address: string | null; municipality: string | null; city: string | null }) {
    return [venue.address, venue.municipality, venue.city].filter(Boolean).join(', ') || 'No address';
}

export function formatPrice(pricePerHour: number | null) {
    return pricePerHour === null ? 'Price on request' : `${pricePerHour} MKD/h`;
}

// „Today · 18:00“, „Tomorrow · 18:00“, „Wed 5 Nov · 18:00“
export function formatDayTime(iso: string) {
    const date = new Date(iso);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let day: string;
    if (date.toDateString() === today.toDateString()) day = 'Today';
    else if (date.toDateString() === tomorrow.toDateString()) day = 'Tomorrow';
    else day = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

    return `${day} · ${formatTime(iso)}`;
}

export function durationMinutes(fromIso: string, toIso: string) {
    return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
}
