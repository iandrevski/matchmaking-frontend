import * as SecureStore from 'expo-secure-store';

const KEY = 'sportify.token';

// на телефон: шифрирано складиште (Keychain на iOS, Keystore на Android)
export function loadToken() {
    return SecureStore.getItemAsync(KEY);
}

export function saveToken(token: string) {
    return SecureStore.setItemAsync(KEY, token);
}

export function clearToken() {
    return SecureStore.deleteItemAsync(KEY);
}