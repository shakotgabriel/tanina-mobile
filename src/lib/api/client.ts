import axios from 'axios';
import { Buffer } from 'buffer';

import { flushQueuedMutations, queueMutationRequest } from '@/src/lib/queue/syncQueue';
import { useAuthStore } from '@/src/lib/store/authStore';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeEnvUrl = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return trimTrailingSlash(value);
};

const ENV_URLS = {
  gateway: normalizeEnvUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  auth: normalizeEnvUrl(process.env.EXPO_PUBLIC_AUTH_SERVICE_URL),
  users: normalizeEnvUrl(process.env.EXPO_PUBLIC_USER_SERVICE_URL),
  wallets: normalizeEnvUrl(process.env.EXPO_PUBLIC_WALLET_SERVICE_URL),
  payment: normalizeEnvUrl(process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL),
  transactions: normalizeEnvUrl(process.env.EXPO_PUBLIC_TRANSACTION_SERVICE_URL),
} as const;

const gatewayBaseUrl = ENV_URLS.gateway;

const SERVICE_BASE_URLS = {
  auth: ENV_URLS.auth ?? 'https://tanina-auth-service.onrender.com',
  users: ENV_URLS.users ?? 'https://tanina-user-service.onrender.com',
  wallets: ENV_URLS.wallets ?? 'https://tanina-wallet-service.onrender.com',
  agent: ENV_URLS.wallets ?? 'https://tanina-wallet-service.onrender.com',
  internal: ENV_URLS.wallets ?? 'https://tanina-wallet-service.onrender.com',
  'mobile-money': ENV_URLS.payment ?? 'https://tanina-payment-service.onrender.com',
  bills: ENV_URLS.payment ?? 'https://tanina-payment-service.onrender.com',
  cashout: ENV_URLS.payment ?? 'https://tanina-payment-service.onrender.com',
  merchant: ENV_URLS.payment ?? 'https://tanina-payment-service.onrender.com',
  p2p: ENV_URLS.transactions ?? 'https://tanina-transaction-service.onrender.com',
  fx: ENV_URLS.transactions ?? 'https://tanina-transaction-service.onrender.com',
} as const;

const getServiceName = (path: string): keyof typeof SERVICE_BASE_URLS => {
  const match = path.match(/\/api\/v1\/([a-z0-9-]+)/);
  const service = match?.[1] as keyof typeof SERVICE_BASE_URLS | undefined;

  if (service && SERVICE_BASE_URLS[service]) {
    return service;
  }

  // Legacy routes in this app that don't follow /api/v1/*.
  if (path.startsWith('/user/')) {
    return 'users';
  }

  return 'auth';
};

const getServiceBaseUrl = (path: string): string => {
  if (gatewayBaseUrl) {
    return gatewayBaseUrl;
  }

  const service = getServiceName(path);
  return SERVICE_BASE_URLS[service];
};

const decodeUserIdFromToken = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const claims = JSON.parse(decoded) as { userId?: string; sub?: string };
    return claims.userId ?? claims.sub ?? null;
  } catch {
    return null;
  }
};

const generateIdempotencyKey = () => {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const isMutationMethod = (method?: string) => {
  if (!method) {
    return false;
  }

  const normalized = method.toLowerCase();
  return normalized === 'post' || normalized === 'put' || normalized === 'patch' || normalized === 'delete';
};

const hasSkipQueueHeader = (headers: unknown) => {
  if (!headers) {
    return false;
  }

  const serialized = typeof (headers as { toJSON?: () => unknown }).toJSON === 'function'
    ? (headers as { toJSON: () => unknown }).toJSON()
    : headers;
  const source = (serialized ?? {}) as Record<string, unknown>;

  return Object.entries(source).some(([key, value]) => {
    return key.toLowerCase() === 'x-skip-queue' && Boolean(value);
  });
};

type QueueAwareError = Error & {
  offlineQueued?: boolean;
};

const AUTH_INVALIDATION_PATHS = [
  '/api/v1/auth/validate-token',
  '/api/v1/auth/refresh',
  '/api/v1/auth/me',
  '/api/v1/auth/logout',
];

const shouldClearAuthForUnauthorized = (error: any): boolean => {
  const requestUrl = String(error?.config?.url ?? '');
  if (AUTH_INVALIDATION_PATHS.some((path) => requestUrl.includes(path))) {
    return true;
  }

  const responseData = error?.response?.data;
  const message = typeof responseData?.message === 'string' ? responseData.message : '';
  const errorCode = typeof responseData?.errorCode === 'string' ? responseData.errorCode : '';
  const combinedSignal = `${message} ${errorCode}`.toLowerCase();

  return (
    combinedSignal.includes('token expired') ||
    combinedSignal.includes('invalid token') ||
    combinedSignal.includes('jwt expired') ||
    combinedSignal.includes('jwt malformed')
  );
};

export const apiClient = axios.create({
  baseURL: gatewayBaseUrl ?? SERVICE_BASE_URLS.auth,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken, userId } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;

    const resolvedUserId = userId ?? decodeUserIdFromToken(accessToken);
    if (resolvedUserId && !config.headers['X-User-Id']) {
      config.headers['X-User-Id'] = resolvedUserId;
    }
  }

  const method = (config.method ?? 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method) && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = generateIdempotencyKey();
  }

  // Determine correct service base URL based on the request path
  if (config.url) {
    const serviceBaseUrl = getServiceBaseUrl(config.url);
    config.baseURL = serviceBaseUrl;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401 && shouldClearAuthForUnauthorized(error)) {
      await useAuthStore.getState().clearAuth();
    }

    const requestConfig = error?.config;
    const mutationRequest = isMutationMethod(requestConfig?.method);
    const shouldQueue = !error?.response && mutationRequest && requestConfig?.url && !hasSkipQueueHeader(requestConfig?.headers);

    if (shouldQueue) {
      const queued = await queueMutationRequest(requestConfig);
      if (queued) {
        (error as QueueAwareError).offlineQueued = true;
      }
    }

    return Promise.reject(error);
  }
);

export const flushOfflineQueue = async () => {
  return flushQueuedMutations(async (mutation) => {
    await apiClient.request({
      url: mutation.url,
      method: mutation.method,
      data: mutation.data,
      params: mutation.params as Record<string, unknown> | undefined,
      headers: {
        ...mutation.headers,
        'X-Skip-Queue': 'true',
      },
    });
  });
};
