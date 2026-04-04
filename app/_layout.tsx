import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useSegments, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from '@/src/components/common/ErrorBoundary';
import NetworkStatusBanner from '@/src/components/common/NetworkStatusBanner';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { flushOfflineQueue } from '@/src/lib/api/client';
import { useAuthStore } from '@/src/lib/store/authStore';

function AuthGuard() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [isAuthenticated, hydrated, segments, router]);

  return null;
}

function OfflineSyncManager() {
  const isOnline = useNetworkStatus();
  const wasOnline = useRef(isOnline);
  const didInitialSync = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOnline.current = false;
      return;
    }

    if (!didInitialSync.current || !wasOnline.current) {
      void flushOfflineQueue();
      didInitialSync.current = true;
    }

    wasOnline.current = true;
  }, [isOnline]);

  return <NetworkStatusBanner isOnline={isOnline} />;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthGuard />
          <OfflineSyncManager />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
