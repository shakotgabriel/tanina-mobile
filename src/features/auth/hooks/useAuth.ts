import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, LoginPayload } from '@/src/lib/api/services';
import { useAuthStore } from '@/src/lib/store/authStore';

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: (payload: LoginPayload) => api.login(payload),
    onSuccess: async ({ accessToken }) => {
      await setToken(accessToken);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (payload: { code: string }) => payload,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: { email: string }) => payload,
  });
};
