import axios from 'axios';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

import { flushQueuedMutations, queueMutationRequest } from '@/src/lib/queue/syncQueue';
import { useAuthStore } from '@/src/lib/store/authStore';

// Service port mapping for direct service endpoints
const SERVICE_PORTS = {
  auth: 8089,
  users: 8081,
  wallets: 8082,
  agent: 8082,
  internal: 8082,
  'mobile-money': 8084,
  bills: 8084,
  cashout: 8084,
  merchant: 8084,
  p2p: 8083,
  fx: 8083,
} as const;

const getBaseHostname = () => {
  const hostname = Platform.select({
    android: '10.0.2.2',
    default: 'localhost',
  }) ?? 'localhost';
  return hostname;
};

const getServicePort = (path: string): number => {
  // Extract service name from path (e.g., /api/v1/auth/* → auth)
  const match = path.match(/\/api\/v1\/([a-z0-9-]+)/);
  const service = match?.[1] as keyof typeof SERVICE_PORTS;

  return SERVICE_PORTS[service] || 8089; // fallback to auth service instead of gateway
};

const getServiceBaseUrl = (path: string): string => {
  const hostname = getBaseHostname();
  const port = getServicePort(path);
  return `http://${hostname}:${port}`;
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

export const apiClient = axios.create({
  baseURL: 'http://localhost', // placeholder, will be overridden in interceptor
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;

    const userId = decodeUserIdFromToken(accessToken);
    if (userId && !config.headers['X-User-Id']) {
      config.headers['X-User-Id'] = userId;
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

    if (status === 401) {
      useAuthStore.getState().clearAuth();
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
