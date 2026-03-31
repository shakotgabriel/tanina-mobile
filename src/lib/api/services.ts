import { apiClient } from '@/src/lib/api/client';
import { ENDPOINTS } from '@/src/lib/api/endpoints';
import { AuthResponse, P2PTransfer, P2PTransferRequest, UserDTO, WalletPocketDTO } from '@/src/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const api = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.auth.login, payload);
    return response.data;
  },
  register: async (payload: { firstName: string; lastName: string; email: string; password: string; phoneNumber?: string; accountType?: string }) => {
    const response = await apiClient.post<UserDTO>(ENDPOINTS.auth.register, payload);
    return response.data;
  },
  verifyEmail: async (payload: { email: string; otp: string }) => {
    const response = await apiClient.post(ENDPOINTS.auth.verifyEmail, payload);
    return response.data;
  },
  forgotPassword: async (payload: { email: string }) => {
    const response = await apiClient.post(ENDPOINTS.auth.forgotPassword, payload);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<UserDTO>(ENDPOINTS.auth.me);
    return response.data;
  },
  getBalances: async () => {
    const response = await apiClient.get<WalletPocketDTO[]>(ENDPOINTS.wallet.balances);
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get<P2PTransfer[]>(ENDPOINTS.wallet.transactions);
    return response.data;
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    const response = await apiClient.patch<UserDTO>(ENDPOINTS.user.updateProfile, payload);
    return response.data;
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await apiClient.post(ENDPOINTS.auth.changePassword, payload);
    return response.data;
  },
  lookupUserByEmail: async (email: string) => {
    const response = await apiClient.get<UserDTO>(ENDPOINTS.user.lookup, { params: { email } });
    return response.data;
  },
  sendP2P: async (payload: P2PTransferRequest) => {
    const response = await apiClient.post<P2PTransfer>(ENDPOINTS.wallet.send, payload);
    return response.data;
  },
};
