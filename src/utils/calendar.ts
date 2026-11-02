// Date → "2026-11-05" во локално време
export function toIsoDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addMonths(date: Date, months: number) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

// неделата почнува во понеделник
export function startOfWeek(date: Date) {
    return addDays(date, -((date.getDay() + 6) % 7));
}

export function weekDays(anchor: Date) {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// сите денови што се гледаат во месецот, во цели недели
export function monthDays(anchor: Date) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const start = startOfWeek(first);
    const end = addDays(startOfWeek(last), 6);
    const days: Date[] = [];
    for (let day = start; day <= end; day = addDays(day, 1)) {
        days.push(day);
    }
    return days;
}