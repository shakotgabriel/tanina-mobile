import type { AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'tanina_sync_queue';
const MAX_QUEUE_ITEMS = 100;

type MutationMethod = 'post' | 'put' | 'patch' | 'delete';

export interface QueuedMutation {
  id: string;
  url: string;
  method: MutationMethod;
  data: unknown;
  params: unknown;
  headers: Record<string, string>;
  queuedAt: number;
  attempts: number;
}

type QueueListener = (state: { queuedCount: number; isSyncing: boolean }) => void;

let queue: QueuedMutation[] = [];
let hasLoaded = false;
let isSyncing = false;
const listeners = new Set<QueueListener>();

const isWeb = Platform.OS === 'web';

const isMutationMethod = (method?: string): method is MutationMethod => {
  if (!method) return false;
  const normalized = method.toLowerCase();
  return normalized === 'post' || normalized === 'put' || normalized === 'patch' || normalized === 'delete';
};

const readPersistedQueue = async () => {
  if (isWeb) {
    return localStorage.getItem(STORAGE_KEY);
  }

  return SecureStore.getItemAsync(STORAGE_KEY);
};

const writePersistedQueue = async (value: string) => {
  if (isWeb) {
    localStorage.setItem(STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, value);
};

const notifyListeners = () => {
  const payload = { queuedCount: queue.length, isSyncing };
  listeners.forEach((listener) => listener(payload));
};

const ensureLoaded = async () => {
  if (hasLoaded) {
    return;
  }

  const stored = await readPersistedQueue();
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as QueuedMutation[];
      queue = Array.isArray(parsed) ? parsed : [];
    } catch {
      queue = [];
    }
  }

  hasLoaded = true;
  notifyListeners();
};

const persistQueue = async () => {
  await writePersistedQueue(JSON.stringify(queue));
  notifyListeners();
};

const normalizeHeaders = (headers: AxiosRequestConfig['headers']): Record<string, string> => {
  if (!headers) {
    return {};
  }

  const serialized = typeof (headers as { toJSON?: () => unknown }).toJSON === 'function'
    ? (headers as { toJSON: () => unknown }).toJSON()
    : headers;

  const source = (serialized ?? {}) as Record<string, unknown>;
  const result: Record<string, string> = {};

  Object.entries(source).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'x-user-id') {
      return;
    }

    if (Array.isArray(value)) {
      result[key] = value.join(', ');
      return;
    }

    result[key] = String(value);
  });

  return result;
};

const toQueuedMutation = (config: AxiosRequestConfig): QueuedMutation | null => {
  const method = config.method?.toLowerCase();
  if (!isMutationMethod(method) || !config.url) {
    return null;
  }

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    url: config.url,
    method,
    data: config.data ?? null,
    params: config.params ?? null,
    headers: normalizeHeaders(config.headers),
    queuedAt: Date.now(),
    attempts: 0,
  };
};

export const queueMutationRequest = async (config: AxiosRequestConfig) => {
  await ensureLoaded();

  const queuedMutation = toQueuedMutation(config);
  if (!queuedMutation) {
    return false;
  }

  queue.push(queuedMutation);

  if (queue.length > MAX_QUEUE_ITEMS) {
    queue = queue.slice(queue.length - MAX_QUEUE_ITEMS);
  }

  await persistQueue();
  return true;
};

export const flushQueuedMutations = async (
  replay: (mutation: QueuedMutation) => Promise<void>
) => {
  await ensureLoaded();

  if (isSyncing || queue.length === 0) {
    return { processed: 0, failed: queue.length };
  }

  isSyncing = true;
  notifyListeners();

  let processed = 0;
  const remaining: QueuedMutation[] = [];

  for (const item of queue) {
    try {
      await replay(item);
      processed += 1;
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  queue = remaining;
  await persistQueue();
  isSyncing = false;
  notifyListeners();

  return { processed, failed: remaining.length };
};

export const subscribeToSyncQueue = (listener: QueueListener) => {
  listeners.add(listener);
  listener({ queuedCount: queue.length, isSyncing });

  void ensureLoaded();

  return () => {
    listeners.delete(listener);
  };
};

export const getSyncQueueState = () => ({
  queuedCount: queue.length,
  isSyncing,
});
