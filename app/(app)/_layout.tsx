import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/lib/store/authStore';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="send" options={{ presentation: 'modal' }} />
      <Stack.Screen name="deposit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="convert" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
