import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'tanina_access_token';
const USER_ID_KEY = 'tanina_user_id';

const isWeb = Platform.OS === 'web';

const setStoredToken = async (token: string) => {
  if (isWeb) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
};

const setStoredUserId = async (userId: string) => {
  if (isWeb) {
    localStorage.setItem(USER_ID_KEY, userId);
    return;
  }

  await SecureStore.setItemAsync(USER_ID_KEY, userId);
};

const getStoredToken = async () => {
  if (isWeb) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

const getStoredUserId = async () => {
  if (isWeb) {
    return localStorage.getItem(USER_ID_KEY);
  }

  return SecureStore.getItemAsync(USER_ID_KEY);
};

const clearStoredToken = async () => {
  if (isWeb) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
};

const clearStoredUserId = async () => {
  if (isWeb) {
    localStorage.removeItem(USER_ID_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(USER_ID_KEY);
};

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  setToken: (token: string, userId?: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userId: null,
  hydrated: false,
  isAuthenticated: false,
  setToken: async (token: string, userId?: string | null) => {
    const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0
      ? userId.trim()
      : null;

    await setStoredToken(token);
    if (normalizedUserId) {
      await setStoredUserId(normalizedUserId);
    } else {
      await clearStoredUserId();
    }

    set({ accessToken: token, userId: normalizedUserId, isAuthenticated: true });
  },
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const [token, userId] = await Promise.all([getStoredToken(), getStoredUserId()]);
    set({
      accessToken: token,
      userId,
      isAuthenticated: Boolean(token),
      hydrated: true,
    });
  },
  clearAuth: async () => {
    await Promise.all([clearStoredToken(), clearStoredUserId()]);
    set({ accessToken: null, userId: null, isAuthenticated: false, hydrated: true });
  },
}));
