import { Text, View } from 'react-native';

import { Badge, Card, EmptyState } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useTransactionsQuery } from '@/src/hooks/useQueries';
import { formatCurrency } from '@/src/lib/utils/currency';

export default function TransactionsScreen() {
  const { data } = useTransactionsQuery();

  return (
    <Screen scrollable>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Transactions</Text>
        {!data?.length ? <EmptyState title="No transactions" description="Your activity will show here." /> : null}
        {data?.map((transaction) => (
          <Card key={transaction.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', textTransform: 'capitalize' }}>
                {transaction.type}
              </Text>
              <Badge label={transaction.status} tone={transaction.status === 'completed' ? 'success' : 'warning'} />
            </View>
            <Text style={{ marginTop: 6, color: '#334155' }}>
              {formatCurrency(transaction.amountMinor, transaction.currency)}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
