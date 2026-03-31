import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Screen from '@/src/components/layout/Screen';
import { useBalancesQuery, useProfileQuery, useTransactionsQuery } from '@/src/hooks/useQueries';
import { formatCurrency } from '@/src/lib/utils/currency';

const QUICK_ACTIONS = [
  { label: 'Send', icon: 'paper-plane-outline' as const, route: '/send' },
  { label: 'Deposit', icon: 'arrow-down-circle-outline' as const, route: '/deposit' },
  { label: 'Withdraw', icon: 'arrow-up-circle-outline' as const, route: '/withdraw' },
  { label: 'Payments', icon: 'cash-outline' as const, route: '/payments' },
];

function txStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed': return 'text-green-600';
    case 'pending': return 'text-amber-500';
    case 'failed': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

function txIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type?.toLowerCase()) {
    case 'deposit': return 'arrow-down-circle-outline';
    case 'withdrawal': return 'arrow-up-circle-outline';
    case 'transfer': return 'swap-horizontal-outline';
    case 'convert': return 'refresh-outline';
    default: return 'ellipse-outline';
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: profile } = useProfileQuery();
  const { data: balances = [] } = useBalancesQuery();
  const { data: transactions = [] } = useTransactionsQuery();

  const primary = balances[0];
  const others = balances.slice(1);
  const recent = transactions.slice(0, 5);

  return (
    <Screen scrollable>
      {/* Greeting */}
      <View className="mb-5">
        <Text className="text-gray-400 text-sm">Good day,</Text>
        <Text className="text-gray-900 text-2xl font-bold leading-tight">
          {profile ? `${(profile as any).firstName} ${(profile as any).lastName}` : 'Welcome back'}
        </Text>
      </View>

      {/* Primary balance card */}
      <View className="bg-[#2F6B2F] rounded-2xl p-5 mb-4">
        <Text className="text-white/60 text-xs font-medium uppercase tracking-widest mb-2">
          Available Balance
        </Text>
        <Text className="text-white text-4xl font-bold mb-1">
          {formatCurrency(primary?.amountMinor ?? 0, primary?.currency ?? 'USD')}
        </Text>
        <Text className="text-white/50 text-xs">
          {primary?.currency ?? 'USD'} Wallet
        </Text>

        {/* Quick actions row inside card */}
        <View className="flex-row gap-2 mt-5">
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.route as any)}
              className="flex-1 items-center bg-white/15 rounded-xl py-3"
            >
              <Ionicons name={action.icon} size={20} color="#FFFFFF" />
              <Text className="text-white text-[10px] font-semibold mt-1">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Other balance pockets */}
      {others.length > 0 && (
        <View className="mb-5">
          <Text className="text-gray-700 text-sm font-semibold mb-2">Other Pockets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {others.map((b) => (
              <View
                key={b.currency}
                className="bg-white border border-gray-100 rounded-xl px-4 py-3 w-44"
              >
                <Text className="text-gray-400 text-xs mb-1">{b.currency}</Text>
                <Text className="text-gray-900 text-base font-bold">
                  {formatCurrency(b.amountMinor, b.currency)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent activity */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-900 text-base font-semibold">Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/transactions' as any)}>
            <Text className="text-[#2F6B2F] text-sm font-medium">See all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View className="bg-white border border-gray-100 rounded-2xl p-8 items-center">
            <Ionicons name="receipt-outline" size={36} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm mt-2">No transactions yet</Text>
          </View>
        ) : (
          <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {recent.map((tx: any, idx: number) => (
              <View
                key={tx.id}
                className={`flex-row items-center px-4 py-3 ${idx < recent.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name={txIcon(tx.type)} size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-sm font-semibold capitalize">{tx.type}</Text>
                  <Text className="text-gray-400 text-xs">{tx.currency}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 text-sm font-semibold">
                    {formatCurrency(tx.amountMinor, tx.currency)}
                  </Text>
                  <Text className={`text-xs capitalize ${txStatusClass(tx.status)}`}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
