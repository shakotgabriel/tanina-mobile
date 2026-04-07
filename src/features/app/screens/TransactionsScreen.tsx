import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTransactionsQuery } from '@/src/hooks/useQueries';
import { useEnrichedTransactions } from '@/src/hooks/useEnrichedTransactions';
import { formatCurrency } from '@/src/lib/utils/currency';
import {
  counterpartyDisplay,
  isCredit,
  sourceDisplay,
  statusBg,
  statusText,
  txIcon,
  txIconColor,
  txLabel,
  directionLabel,
  statusLabel,
  txTitle,
  txSubtitle,
} from '@/src/lib/utils/transaction-ui';
import { EmptyState, Skeleton } from '@/src/components/common';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tx = {
  id: string;
  type: string;
  direction?: 'CREDIT' | 'DEBIT';
  amountMinor: number;
  currency: string;
  status: string;
  occurredAt?: string;
  createdAt?: string;
  description?: string;
  counterparty?: string;
  counterpartyUserId?: string;
  counterpartyDisplayName?: string;
  counterpartyLabel?: string;
  source?: string;
  reference?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_STATUSES = ['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'];
const DATE_RANGES = ['All Time', 'Today', 'This Week', 'This Month'];
const PAGE_SIZE = 10;

const STATUS_FILTER_LABELS: Record<string, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesStatusFilter(status: string, filter: string) {
  if (filter === 'ALL') {
    return true;
  }

  return status?.toUpperCase() === filter;
}

function txTime(tx: Tx) {
  return tx.occurredAt ?? tx.createdAt;
}

function withinDateRange(tx: Tx, range: string) {
  const timestamp = txTime(tx);
  if (range === 'All Time' || !timestamp) return true;
  const date = new Date(timestamp);
  const now = new Date();
  if (range === 'Today') {
    return date.toDateString() === now.toDateString();
  }
  const msAgo = range === 'This Week' ? 7 * 864e5 : 30 * 864e5;
  return now.getTime() - date.getTime() <= msAgo;
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className="flex-row justify-between items-start py-2.5 border-b border-gray-100">
      <Text className="text-gray-400 text-sm w-28">{label}</Text>
      <Text className={`text-gray-800 text-sm font-medium flex-1 text-right ${mono ? 'font-mono' : ''}`} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function TransactionDetailModal({ tx, onClose }: { tx: Tx | null; onClose: () => void }) {
  if (!tx) return null;
  const credit = isCredit(tx);
  const color = txIconColor(tx.type, tx.direction);
  const counterpartyValue = counterpartyDisplay(tx) ?? '';
  const sourceValue = sourceDisplay(tx);

  return (
    <Modal visible={!!tx} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-gray-900 text-lg font-bold">Transaction Details</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Receipt hero */}
          <View className="items-center py-4 mb-4 bg-gray-50 rounded-2xl">
            <View style={{ backgroundColor: color + '18', borderRadius: 999, padding: 14, marginBottom: 10 }}>
              <Ionicons name={txIcon(tx.type)} size={32} color={color} />
            </View>
            <Text className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-1">{txLabel(tx.type)}</Text>
            <Text style={{ color }} className="text-3xl font-bold">
              {credit ? '+' : '−'} {formatCurrency(tx.amountMinor, tx.currency)}
            </Text>
            <View className={`mt-2 px-3 py-1 rounded-full ${statusBg(tx.status)}`}>
              <Text className={`text-xs font-semibold uppercase ${statusText(tx.status)}`}>{statusLabel(tx.status)}</Text>
            </View>
          </View>

          {/* Detail rows */}
          <DetailRow label="Direction" value={directionLabel(tx.direction ?? (credit ? 'CREDIT' : 'DEBIT'))} />
          <DetailRow label="Currency" value={tx.currency} />
          {tx.description && <DetailRow label="Description" value={tx.description} />}
          {!!counterpartyValue && <DetailRow label="Counterparty" value={counterpartyValue} />}
          {sourceValue && <DetailRow label="Source" value={sourceValue} />}
          {tx.reference && <DetailRow label="Reference" value={tx.reference} mono />}
          {txTime(tx) && (
            <DetailRow label="Date" value={new Date(txTime(tx)!).toLocaleString()} />
          )}
          <DetailRow label="Transaction ID" value={tx.id} mono />
        </View>
      </View>
    </Modal>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────

function FilterChips({
  options,
  selected,
  onSelect,
  labelForOption,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  labelForOption?: (value: string) => string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onSelect(o)}
          className={`px-3 py-1.5 rounded-full border ${selected === o ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-xs font-semibold ${selected === o ? 'text-white' : 'text-gray-600'}`}>
            {labelForOption ? labelForOption(o) : o}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TransactionItem({ tx, onPress }: { tx: Tx; onPress: () => void }) {
  const credit = isCredit(tx);
  const color = txIconColor(tx.type, tx.direction);
  const subtitle = txSubtitle(tx);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100"
    >
      <View style={{ backgroundColor: color + '18', borderRadius: 999, padding: 9, marginRight: 12 }}>
        <Ionicons name={txIcon(tx.type)} size={18} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 text-sm font-semibold">{txTitle(tx)}</Text>
        <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View className="items-end ml-2">
        <Text style={{ color }} className="text-sm font-bold">
          {credit ? '+' : '−'}{formatCurrency(tx.amountMinor, tx.currency)}
        </Text>
        <View className={`mt-1 px-2 py-0.5 rounded-full ${statusBg(tx.status)}`}>
          <Text className={`text-[10px] font-semibold uppercase ${statusText(tx.status)}`}>{statusLabel(tx.status)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

// ─── Transactions Screen ──────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { data, isLoading } = useTransactionsQuery(true); // Enable query when viewing transactions

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter]     = useState('All Time');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Tx | null>(null);

  const transactions = useMemo(() => (Array.isArray(data) ? (data as Tx[]) : []), [data]);
  const enrichedTransactions = useEnrichedTransactions(transactions);

  const filtered = useMemo(() => {
    return enrichedTransactions.filter((tx) => {
      const matchStatus = matchesStatusFilter(tx.status, statusFilter);
      const matchDate   = withinDateRange(tx, dateFilter);
      return matchStatus && matchDate;
    });
  }, [enrichedTransactions, statusFilter, dateFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = paginated.length < filtered.length;
  const showLoadingSkeleton = isLoading && transactions.length === 0;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Sticky filters */}
      <View className="bg-white border-b border-gray-100 px-4 pt-3 pb-3 gap-2">
        <Text className="text-gray-900 text-2xl font-bold mb-1">Transactions</Text>
        <Text className="text-gray-500 text-xs mb-1">
          {isLoading ? 'Loading transactions...' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
        </Text>
        <FilterChips
          options={TX_STATUSES}
          selected={statusFilter}
          onSelect={(v) => { setStatusFilter(v); setPage(1); }}
          labelForOption={(value) => STATUS_FILTER_LABELS[value] ?? txLabel(value)}
        />
        <FilterChips options={DATE_RANGES} selected={dateFilter}   onSelect={(v) => { setDateFilter(v);   setPage(1); }} />
      </View>

      {showLoadingSkeleton ? (
        <View className="px-4 pt-3 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`tx-skeleton-${index}`} height={70} />
          ))}
        </View>
      ) : (
        <FlatList
          data={paginated}
          keyExtractor={(tx, index) => `${tx.id}-${tx.createdAt ?? tx.occurredAt ?? index}`}
          renderItem={({ item }) => (
            <TransactionItem tx={item} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-4">
              <EmptyState
                title="No transactions found"
                description="Try a different date or status filter."
              />
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                className="mx-4 my-4 py-3 border border-gray-200 rounded-xl items-center bg-white"
              >
                <Text className="text-gray-600 text-sm font-semibold">Load more</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
