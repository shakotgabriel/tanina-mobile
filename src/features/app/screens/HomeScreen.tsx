import { Text, View } from 'react-native';

import { Card } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useBalancesQuery } from '@/src/hooks/useQueries';
import { formatCurrency } from '@/src/lib/utils/currency';

export default function HomeScreen() {
  const { data } = useBalancesQuery();

  return (
    <Screen scrollable>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Wallet</Text>
        {(data ?? []).map((balance) => (
          <Card key={balance.currency}>
            <Text style={{ fontSize: 14, color: '#64748B' }}>{balance.currency}</Text>
            <Text style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
              {formatCurrency(balance.amountMinor, balance.currency)}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
