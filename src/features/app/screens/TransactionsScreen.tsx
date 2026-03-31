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
import { formatCurrency } from '@/src/lib/utils/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tx = {
  id: string;
  type: string;
  direction?: 'CREDIT' | 'DEBIT';
  amountMinor: number;
  currency: string;
  status: string;
  createdAt?: string;
  description?: string;
  counterparty?: string;
  reference?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_TYPES = ['ALL', 'TOPUP', 'SEND', 'PAYMENT', 'REFUND', 'WITHDRAWAL'];
const TX_STATUSES = ['ALL', 'PENDING', 'COMPLETED', 'FAILED'];
const DATE_RANGES = ['All Time', 'Today', 'This Week', 'This Month'];
const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function txIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type?.toUpperCase()) {
    case 'TOPUP':      return 'arrow-down-circle';
    case 'SEND':       return 'paper-plane';
    case 'PAYMENT':    return 'card';
    case 'REFUND':     return 'refresh-circle';
    case 'WITHDRAWAL': return 'arrow-up-circle';
    default:           return 'ellipse';
  }
}

function txIconColor(type: string, direction?: string) {
  if (direction === 'CREDIT') return '#16A34A';
  if (direction === 'DEBIT')  return '#DC2626';
  switch (type?.toUpperCase()) {
    case 'TOPUP':   return '#16A34A';
    case 'REFUND':  return '#2563EB';
    case 'SEND':
    case 'WITHDRAWAL': return '#DC2626';
    default: return '#6B7280';
  }
}

function statusBg(status: string) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'bg-green-100';
    case 'PENDING':   return 'bg-amber-100';
    case 'FAILED':    return 'bg-red-100';
    default:          return 'bg-gray-100';
  }
}

function statusText(status: string) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'text-green-700';
    case 'PENDING':   return 'text-amber-700';
    case 'FAILED':    return 'text-red-700';
    default:          return 'text-gray-600';
  }
}

function isCredit(tx: Tx) {
  if (tx.direction) return tx.direction === 'CREDIT';
  const t = tx.type?.toUpperCase();
  return t === 'TOPUP' || t === 'REFUND';
}

function withinDateRange(tx: Tx, range: string) {
  if (range === 'All Time' || !tx.createdAt) return true;
  const date = new Date(tx.createdAt);
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
            <Text className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-1">{tx.type}</Text>
            <Text style={{ color }} className="text-3xl font-bold">
              {credit ? '+' : '−'} {formatCurrency(tx.amountMinor, tx.currency)}
            </Text>
            <View className={`mt-2 px-3 py-1 rounded-full ${statusBg(tx.status)}`}>
              <Text className={`text-xs font-semibold uppercase ${statusText(tx.status)}`}>{tx.status}</Text>
            </View>
          </View>

          {/* Detail rows */}
          <DetailRow label="Direction" value={tx.direction ?? (credit ? 'CREDIT' : 'DEBIT')} />
          <DetailRow label="Currency" value={tx.currency} />
          {tx.description && <DetailRow label="Description" value={tx.description} />}
          {tx.counterparty && <DetailRow label="Counterparty" value={tx.counterparty} />}
          {tx.reference && <DetailRow label="Reference" value={tx.reference} mono />}
          {tx.createdAt && (
            <DetailRow label="Date" value={new Date(tx.createdAt).toLocaleString()} />
          )}
          <DetailRow label="ID" value={tx.id} mono />
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
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onSelect(o)}
          className={`px-3 py-1.5 rounded-full border ${selected === o ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-xs font-semibold ${selected === o ? 'text-white' : 'text-gray-600'}`}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TransactionItem({ tx, onPress }: { tx: Tx; onPress: () => void }) {
  const credit = isCredit(tx);
  const color = txIconColor(tx.type, tx.direction);
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100"
    >
      <View style={{ backgroundColor: color + '18', borderRadius: 999, padding: 9, marginRight: 12 }}>
        <Ionicons name={txIcon(tx.type)} size={18} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 text-sm font-semibold capitalize">{tx.type}</Text>
        <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
          {tx.counterparty ?? tx.description ?? tx.currency}
        </Text>
      </View>
      <View className="items-end ml-2">
        <Text style={{ color }} className="text-sm font-bold">
          {credit ? '+' : '−'}{formatCurrency(tx.amountMinor, tx.currency)}
        </Text>
        <View className={`mt-1 px-2 py-0.5 rounded-full ${statusBg(tx.status)}`}>
          <Text className={`text-[10px] font-semibold uppercase ${statusText(tx.status)}`}>{tx.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Transactions Screen ──────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { data = [], isLoading } = useTransactionsQuery();

  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter]     = useState('All Time');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Tx | null>(null);

  const filtered = useMemo(() => {
    return (data as Tx[]).filter((tx) => {
      const matchType   = typeFilter === 'ALL'   || tx.type?.toUpperCase()   === typeFilter;
      const matchStatus = statusFilter === 'ALL' || tx.status?.toUpperCase() === statusFilter;
      const matchDate   = withinDateRange(tx, dateFilter);
      return matchType && matchStatus && matchDate;
    });
  }, [data, typeFilter, statusFilter, dateFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = paginated.length < filtered.length;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Sticky filters */}
      <View className="bg-white border-b border-gray-100 px-4 pt-3 pb-3 gap-2">
        <Text className="text-gray-900 text-2xl font-bold mb-1">Transactions</Text>
        <FilterChips options={TX_TYPES}    selected={typeFilter}   onSelect={(v) => { setTypeFilter(v);   setPage(1); }} />
        <FilterChips options={TX_STATUSES} selected={statusFilter} onSelect={(v) => { setStatusFilter(v); setPage(1); }} />
        <FilterChips options={DATE_RANGES} selected={dateFilter}   onSelect={(v) => { setDateFilter(v);   setPage(1); }} />
      </View>

      <FlatList
        data={paginated}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item }) => (
          <TransactionItem tx={item} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm mt-3">
              {isLoading ? 'Loading…' : 'No transactions found'}
            </Text>
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

      <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
