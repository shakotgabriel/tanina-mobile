import { Text, View } from 'react-native';

import { Button, Card } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useProfileQuery } from '@/src/hooks/useQueries';
import { useAuthStore } from '@/src/lib/store/authStore';

export default function ProfileScreen() {
  const { data } = useProfileQuery();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Profile</Text>
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A' }}>{data?.fullName ?? 'Guest user'}</Text>
          <Text style={{ marginTop: 4, color: '#64748B' }}>{data?.email ?? 'guest@example.com'}</Text>
        </Card>
        <Button variant="secondary" onPress={() => clearAuth()}>
          Logout
        </Button>
      </View>
    </Screen>
  );
}
