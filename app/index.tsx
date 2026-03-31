import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/lib/store/authStore';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}
