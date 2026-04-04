import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState, Skeleton } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useBalancesQuery, useProfileQuery, useTransactionsQuery } from '@/src/hooks/useQueries';
import { useEnrichedTransactions } from '@/src/hooks/useEnrichedTransactions';
import { formatCurrency } from '@/src/lib/utils/currency';
import {
  isCredit,
  statusBg,
  statusText,
  txIcon,
  txIconColor,
  txLabel,
} from '@/src/lib/utils/transaction-ui';

const QUICK_ACTIONS = [
  { label: 'Send', icon: 'paper-plane-outline' as const, route: '/send' },
  { label: 'Deposit', icon: 'arrow-down-circle-outline' as const, route: '/deposit' },
  { label: 'Withdraw', icon: 'arrow-up-circle-outline' as const, route: '/withdraw' },
  { label: 'Payments', icon: 'cash-outline' as const, route: '/payments' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(true); // Enable query when on home screen
  const { data: balancesData, isLoading: balancesLoading } = useBalancesQuery(true, true);
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactionsQuery(true); // Enable query to display recent transactions

  const balances = Array.isArray(balancesData) ? balancesData : [];
  const transactions = Array.isArray(transactionsData) ? transactionsData : [];
  const enrichedTransactions = useEnrichedTransactions(transactions as any[]);

  const primary = balances.find((b: any) => b.currency === 'USD') ?? balances[0];
  const others = balances.filter((b: any) => b.currency !== primary?.currency);
  const recent = enrichedTransactions.slice(0, 5);

  const firstName = (profile as any)?.firstName?.trim?.() ?? '';
  const lastName = (profile as any)?.lastName?.trim?.() ?? '';
  const email = (profile as any)?.email ?? '';
  const fallbackName = email ? email.split('@')[0] : 'Welcome back';
  const displayName = `${firstName} ${lastName}`.trim() || fallbackName;

  return (
    <Screen scrollable>
      {/* Greeting */}
      <View className="mb-5">
        <Text className="text-gray-400 text-sm">Good day,</Text>
        {profileLoading ? (
          <Skeleton height={32} width={192} style={{ marginTop: 4 }} />
        ) : (
          <Text className="text-gray-900 text-2xl font-bold leading-tight">
            {displayName}
          </Text>
        )}
      </View>

      {/* Primary balance card */}
      {balancesLoading ? (
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <Skeleton height={12} width={110} />
          <Skeleton height={38} width={180} style={{ marginTop: 10 }} />
          <Skeleton height={12} width={84} style={{ marginTop: 8 }} />
          <View className="flex-row gap-2 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={56} style={{ flex: 1 }} />
            ))}
          </View>
        </View>
      ) : (
        <View className="bg-[#2F6B2F] rounded-2xl p-5 mb-4">
          <Text className="text-white/60 text-xs font-medium uppercase tracking-widest mb-2">
            Available Balance
          </Text>
          <Text className="text-white text-4xl font-bold mb-1">
            {formatCurrency(primary?.availableBalanceMinor ?? 0, primary?.currency ?? 'USD')}
          </Text>
          <Text className="text-white/50 text-xs">
            {primary?.currency ?? 'USD'} Wallet
          </Text>
          {primary?.ledgerBalanceMinor != null && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.45)" />
              <Text className="text-white/45 text-xs">
                On hold: {formatCurrency(primary.ledgerBalanceMinor - primary.availableBalanceMinor, primary.currency)}
              </Text>
            </View>
          )}

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
      )}

      {/* Other balance pockets */}
      {balancesLoading ? (
        <View className="mb-5">
          <Text className="text-gray-700 text-sm font-semibold mb-2">Other Pockets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={64} width={176} />
            ))}
          </ScrollView>
        </View>
      ) : others.length > 0 && (
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
                  {formatCurrency(b.availableBalanceMinor ?? 0, b.currency)}
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

        {transactionsLoading ? (
          <View className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={64} />
            ))}
          </View>
        ) : recent.length === 0 ? (
          <EmptyState title="No transactions yet" description="Once you send, deposit, or pay, your recent activity will appear here." />
        ) : (
          <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {recent.map((tx: any, idx: number) => (
              (() => {
                const credit = isCredit(tx);
                const color = txIconColor(tx.type, tx.direction);
                return (
              <View
                key={`${tx.id}-${tx.createdAt ?? tx.occurredAt ?? idx}`}
                className={`flex-row items-center px-4 py-3 ${idx < recent.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: color + '18' }}
                >
                  <Ionicons name={txIcon(tx.type)} size={16} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-sm font-semibold">
                    {txLabel(tx.type)}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                    {tx.counterpartyLabel ?? tx.counterparty ?? (tx.counterpartyUserId ? 'Resolving user...' : undefined) ?? tx.description ?? tx.currency}
                  </Text>
                </View>
                <View className="items-end">
                  <Text style={{ color }} className="text-sm font-semibold">
                    {(credit ? '+' : '-')} {formatCurrency(tx.amountMinor, tx.currency)}
                  </Text>
                  <View className={`mt-1 px-2 py-0.5 rounded-full ${statusBg(tx.status)}`}>
                    <Text className={`text-[10px] font-semibold uppercase ${statusText(tx.status)}`}>{tx.status}</Text>
                  </View>
                </View>
              </View>
                );
              })()
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
