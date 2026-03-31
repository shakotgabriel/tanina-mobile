import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/lib/store/authStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
