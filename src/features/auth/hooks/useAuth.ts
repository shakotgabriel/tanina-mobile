import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { notify } from '@/src/lib/utils/notify';

import { api, LoginPayload } from '@/src/lib/api/services';
import { useAuthStore } from '@/src/lib/store/authStore';
import { ForgotPasswordRequest, RegisterRequest, ResendOtpRequest, VerifyEmailRequest } from '@/src/types';

type ApiErrorBody = {
  message?: string;
};

const navigateToVerifyEmail = (router: ReturnType<typeof useRouter>, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  router.replace({
    pathname: '/verify-email',
    params: { email: normalizedEmail },
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorBody | undefined;
    return responseData?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const isLikelyCorsBlockedRegisterResponse = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const hasNoResponse = !error.response;
  const isNetworkLikeError =
    error.code === 'ERR_NETWORK' ||
    error.message.includes('Network Error') ||
    error.message.includes('ERR_FAILED') ||
    error.message.includes('201');

  return hasNoResponse && isNetworkLikeError;
};

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: (payload: LoginPayload) => api.login(payload),
    onSuccess: async (data: any) => {
      const authPayload = data?.data ?? data;
      const token =
        authPayload?.accessToken ??
        authPayload?.token ??
        data?.accessToken ??
        data?.token ??
        (typeof data === 'string' ? data : null);
      const userId = authPayload?.userId ?? data?.userId ?? null;

      if (token && typeof token === 'string') {
        await setToken(token, typeof userId === 'string' ? userId : null);
      }
    },
    onError: () => {
      notify.error('Login failed', 'Invalid email or password.');
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => api.register(payload),
    onSuccess: (_data, variables) => {
      navigateToVerifyEmail(router, variables.email);
    },
    onError: (error, variables) => {
      if (isLikelyCorsBlockedRegisterResponse(error)) {
        notify.info('Account created', 'Check your email and verify your OTP code.');
        navigateToVerifyEmail(router, variables.email);
        return;
      }

      notify.error('Registration failed', getErrorMessage(error, 'Please check your details and try again.'));
    },
  });
};

export const useVerifyEmail = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => api.verifyEmail(payload),
    onSuccess: () => {
      notify.success('Email verified!', 'You can now log in.');
      router.replace('/(auth)/login');
    },
    onError: () => {
      notify.validation('Invalid code');
    },
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (payload: ResendOtpRequest) => api.resendOtp(payload),
    onSuccess: () => {
      notify.success('Code sent', 'A new verification code has been sent to your email.');
    },
    onError: (error) => {
      notify.error('Failed to resend', getErrorMessage(error, 'Please try again in a moment.'));
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => api.forgotPassword(payload),
    onSuccess: () => {
      notify.success('Reset link sent', 'Check your inbox for the Tanina reset email.');
    },
    onError: () => {
      notify.error('Reset request failed', 'Could not send the reset link. Please try again.');
    },
  });
};
