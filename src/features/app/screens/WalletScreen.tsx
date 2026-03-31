import { Text, View } from 'react-native';

import { EmptyState } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';

export default function WalletScreen() {
  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Cards</Text>
        <EmptyState title="No cards yet" description="Virtual and physical card management goes here." />
      </View>
    </Screen>
  );
}
