import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { api, LoginPayload } from '@/src/lib/api/services';
import { useAuthStore } from '@/src/lib/store/authStore';

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: (payload: LoginPayload) => api.login(payload),
    onSuccess: async (data: any) => {
      const token = data?.accessToken ?? data?.token ?? data;
      if (token && typeof token === 'string') {
        await setToken(token);
      }
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Login failed', text2: 'Invalid email or password.' });
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: { firstName: string; lastName: string; email: string; password: string; phoneNumber?: string; accountType?: string }) =>
      api.register(payload),
    onSuccess: (_data, variables) => {
      router.push(`/(auth)/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: 'Please check your details and try again.' });
    },
  });
};

export const useVerifyEmail = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: { email: string; otp: string }) => api.verifyEmail(payload),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Email verified!', text2: 'You can now log in.' });
      router.replace('/(auth)/login');
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Invalid code', text2: 'Please check the code and try again.' });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: { email: string }) => api.forgotPassword(payload),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Reset email sent',
        text2: 'Check your inbox for reset instructions.',
      });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not send reset email. Try again.' });
    },
  });
};
