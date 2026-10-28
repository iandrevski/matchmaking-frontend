const KEY = 'sportify.token';

// SecureStore не постои на web → localStorage (само за развој во browser)
export async function loadToken() {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
}

export async function saveToken(token: string) {
    try {
        localStorage.setItem(KEY, token);
    } catch {
        // приватен прозорец / блокирано складиште
    }
}

export async function clearToken() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // исто
    }
}