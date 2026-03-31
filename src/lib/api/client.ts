import axios from 'axios';

import { useAuthStore } from '@/src/lib/store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  }
);
