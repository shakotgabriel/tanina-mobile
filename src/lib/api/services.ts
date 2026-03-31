import { apiClient } from '@/src/lib/api/client';
import { ENDPOINTS } from '@/src/lib/api/endpoints';
import { AuthTokens, Transaction, User, WalletBalance } from '@/src/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export const api = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthTokens>(ENDPOINTS.auth.login, payload);
    return response.data;
  },
  register: async (payload: { fullName: string; email: string; password: string }) => {
    const response = await apiClient.post<User>(ENDPOINTS.auth.register, payload);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<User>(ENDPOINTS.auth.me);
    return response.data;
  },
  getBalances: async () => {
    const response = await apiClient.get<WalletBalance[]>(ENDPOINTS.wallet.balances);
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get<Transaction[]>(ENDPOINTS.wallet.transactions);
    return response.data;
  },
};
