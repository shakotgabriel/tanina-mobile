import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'tanina_access_token';

const isWeb = Platform.OS === 'web';

const setStoredToken = async (token: string) => {
  if (isWeb) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
};

const getStoredToken = async () => {
  if (isWeb) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

const clearStoredToken = async () => {
  if (isWeb) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
};

interface AuthState {
  accessToken: string | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => Promise<void>;
  hydrate: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  hydrated: false,
  isAuthenticated: false,
  setToken: async (token: string) => {
    await setStoredToken(token);
    set({ accessToken: token, isAuthenticated: true });
  },
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const token = await getStoredToken();
    set({ accessToken: token, isAuthenticated: Boolean(token), hydrated: true });
  },
  clearAuth: async () => {
    await clearStoredToken();
    set({ accessToken: null, isAuthenticated: false, hydrated: true });
  },
}));
