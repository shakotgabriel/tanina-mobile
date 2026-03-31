import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import Screen from '@/src/components/layout/Screen';
import { useBalancesQuery, useTransactionsQuery } from '@/src/hooks/useQueries';
import { formatCurrency } from '@/src/lib/utils/currency';

const SECONDARY_CURRENCIES = ['SSP', 'KSH', 'UGX', 'RWF'];
const ALL_CURRENCIES = ['USD', 'SSP', 'KSH', 'UGX', 'RWF'];

const FX_RATES: Record<string, number> = {
  USD: 1,
  SSP: 1300,
  KSH: 130,
  UGX: 3700,
  RWF: 1280,
};

const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  USD: { flag: '🇺🇸', name: 'US Dollar' },
  SSP: { flag: '🇸🇸', name: 'S. Sudan Pound' },
  KSH: { flag: '🇰🇪', name: 'Kenya Shilling' },
  UGX: { flag: '🇺🇬', name: 'Uganda Shilling' },
  RWF: { flag: '🇷🇼', name: 'Rwanda Franc' },
};

const MOBILE_MONEY_PROVIDERS: Record<string, { name: string; placeholder: string }[]> = {
  SSP: [{ name: 'MTN MoMo', placeholder: '+211 9XX XXX XXX' }],
  UGX: [{ name: 'MTN Mobile Money', placeholder: '+256 7XX XXX XXX' }],
  KSH: [{ name: 'M-Pesa', placeholder: '+254 7XX XXX XXX' }],
  RWF: [{ name: 'MTN Mobile Money', placeholder: '+250 7XX XXX XXX' }],
  USD: [
    { name: 'Mobile Money', placeholder: 'Phone number' },
    { name: 'Bank Transfer', placeholder: 'Account number' },
    { name: 'Debit Card', placeholder: 'Card number' },
  ],
};

// ─── Top Up Modal ────────────────────────────────────────────────────────────

function TopUpModal({
  visible,
  onClose,
  defaultCurrency,
}: {
  visible: boolean;
  onClose: () => void;
  defaultCurrency?: string;
}) {
  const [currency, setCurrency] = useState(defaultCurrency ?? 'USD');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const providers = MOBILE_MONEY_PROVIDERS[currency] ?? MOBILE_MONEY_PROVIDERS['USD'];
  const provider = providers[0];

  const handleConfirm = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a phone number' });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    Toast.show({
      type: 'success',
      text1: 'Top-up initiated',
      text2: `${currency} ${amount} via ${provider.name}`,
    });
    setAmount('');
    setPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-gray-900 text-lg font-bold">Top Up Wallet</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Select Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
            {SECONDARY_CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCurrency(c)}
                className={`px-4 py-2 rounded-full border ${currency === c ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-semibold ${currency === c ? 'text-white' : 'text-gray-600'}`}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Provider badge */}
          <View className="flex-row items-center gap-2 bg-[#F0F7F0] border border-[#2F6B2F]/20 rounded-xl px-4 py-3 mb-4">
            <Ionicons name="phone-portrait-outline" size={18} color="#2F6B2F" />
            <Text className="text-[#2F6B2F] text-sm font-semibold">{provider.name}</Text>
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-4">
            <Ionicons name="call-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 py-3 text-gray-900 text-base"
              keyboardType="phone-pad"
              placeholder={provider.placeholder}
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Amount</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-6">
            <Text className="text-gray-500 mr-2 text-sm font-medium">{currency}</Text>
            <TextInput
              className="flex-1 py-3 text-gray-900 text-base"
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            className="bg-[#2F6B2F] rounded-xl py-4 items-center"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">Confirm Top Up</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Exchange Modal ───────────────────────────────────────────────────────────

function ExchangeModal({
  visible,
  onClose,
  defaultFrom = 'USD',
  balances = [],
}: {
  visible: boolean;
  onClose: () => void;
  defaultFrom?: string;
  balances?: any[];
}) {
  const [fromCurrency, setFromCurrency] = useState(defaultFrom);
  const [toCurrency, setToCurrency] = useState(defaultFrom === 'USD' ? 'KSH' : 'USD');
  const [fromAmount, setFromAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setFromCurrency(defaultFrom);
      setToCurrency(defaultFrom === 'USD' ? 'KSH' : 'USD');
      setFromAmount('');
    }
  }, [visible, defaultFrom]);

  const numericAmount = Number(fromAmount);
  const fee = numericAmount * 0.01;
  const rate = (FX_RATES[toCurrency] ?? 1) / (FX_RATES[fromCurrency] ?? 1);
  const toAmount = (numericAmount - fee) * rate;

  const fromBalance = (balances as any[]).find((b) => b.currency === fromCurrency);
  const fromBalanceLabel = fromBalance
    ? formatCurrency(fromBalance.availableBalanceMinor ?? 0, fromCurrency)
    : '—';

  function handleSwap() {
    const prev = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prev);
    setFromAmount('');
  }

  function handleSelectFrom(c: string) {
    if (c === toCurrency) setToCurrency(fromCurrency);
    setFromCurrency(c);
    setFromAmount('');
  }

  function handleSelectTo(c: string) {
    if (c === fromCurrency) setFromCurrency(toCurrency);
    setToCurrency(c);
  }

  const handleConfirm = async () => {
    if (!fromAmount || isNaN(numericAmount) || numericAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    Toast.show({
      type: 'success',
      text1: 'Exchange submitted',
      text2: `${fromCurrency} ${numericAmount.toFixed(2)} → ${toCurrency} ${toAmount.toFixed(2)}`,
    });
    setFromAmount('');
    onClose();
  };

  const rateLabel =
    rate >= 1
      ? `1 ${fromCurrency} = ${rate.toFixed(2)} ${toCurrency}`
      : `1 ${toCurrency} = ${(1 / rate).toFixed(2)} ${fromCurrency}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-gray-900 text-lg font-bold">Exchange Currency</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Convert between any of your wallets</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* FROM currency chips */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">From</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
            {ALL_CURRENCIES.map((c) => {
              const meta = CURRENCY_META[c];
              const active = fromCurrency === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleSelectFrom(c)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${active ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'border-gray-200 bg-white'}`}
                >
                  <Text style={{ fontSize: 13 }}>{meta.flag}</Text>
                  <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* From amount input */}
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-1">
            <View className="mr-3">
              <Text style={{ fontSize: 16 }}>{CURRENCY_META[fromCurrency]?.flag}</Text>
            </View>
            <Text className="text-gray-500 mr-2 text-sm font-semibold">{fromCurrency}</Text>
            <TextInput
              className="flex-1 py-3 text-gray-900 text-base"
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
          </View>
          <Text className="text-gray-400 text-xs mb-3 ml-1">Available: {fromBalanceLabel}</Text>

          {/* Swap button */}
          <View className="items-center mb-3">
            <TouchableOpacity
              onPress={handleSwap}
              className="flex-row items-center gap-2 bg-[#F0F7F0] border border-[#2F6B2F]/20 rounded-full px-4 py-2"
            >
              <Ionicons name="swap-vertical" size={18} color="#2F6B2F" />
              <Text className="text-[#2F6B2F] text-xs font-semibold">Swap</Text>
            </TouchableOpacity>
          </View>

          {/* TO currency chips */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">To</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
            {ALL_CURRENCIES.filter((c) => c !== fromCurrency).map((c) => {
              const meta = CURRENCY_META[c];
              const active = toCurrency === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleSelectTo(c)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${active ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'border-gray-200 bg-white'}`}
                >
                  <Text style={{ fontSize: 13 }}>{meta.flag}</Text>
                  <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rate preview */}
          {numericAmount > 0 ? (
            <View className="bg-[#F0F7F0] border border-[#2F6B2F]/15 rounded-xl p-4 mb-5 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Rate</Text>
                <Text className="text-gray-800 text-sm font-medium">{rateLabel}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Fee (1%)</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  {fromCurrency} {fee.toFixed(2)}
                </Text>
              </View>
              <View className="h-px bg-[#2F6B2F]/15" />
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 text-sm font-semibold">You receive</Text>
                <Text className="text-[#2F6B2F] text-base font-bold">
                  {toCurrency} {toAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
              <Text className="text-gray-400 text-sm text-center">Enter an amount to see the exchange preview</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            className="bg-[#2F6B2F] rounded-xl py-4 items-center"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">
                  {fromCurrency} → {toCurrency} · Confirm
                </Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Wallet Screen ────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { data: balances = [] } = useBalancesQuery();
  const { data: transactions = [] } = useTransactionsQuery();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [topUpCurrency, setTopUpCurrency] = useState<string | undefined>();
  const [exchangeVisible, setExchangeVisible] = useState(false);
  const [exchangeFrom, setExchangeFrom] = useState<string>('USD');

  const primaryData = (balances as any[]).find((b) => b.currency === 'USD') ?? (balances as any[])[0];
  const recent = (transactions as any[]).slice(0, 4);

  const openTopUp = (currency?: string) => {
    setTopUpCurrency(currency);
    setTopUpVisible(true);
  };

  const openExchange = (currency = 'USD') => {
    setExchangeFrom(currency);
    setExchangeVisible(true);
  };

  return (
    <Screen scrollable>
      <Text className="text-gray-900 text-2xl font-bold mb-5">My Wallet</Text>

      {/* Primary Balance Card — always visible */}
      <View className="bg-[#2F6B2F] rounded-2xl p-5 mb-5">
        <Text className="text-white/60 text-xs font-medium uppercase tracking-widest mb-2">
          Available Balance
        </Text>
        <Text className="text-white text-4xl font-bold mb-1">
          {formatCurrency(primaryData?.availableBalanceMinor ?? 0, primaryData?.currency ?? 'USD')}
        </Text>
        <Text className="text-white/50 text-xs">
          {primaryData?.currency ?? 'USD'} Wallet
        </Text>
        {primaryData?.ledgerBalanceMinor != null && (
          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.45)" />
            <Text className="text-white/45 text-xs">
              On hold: {formatCurrency(primaryData.ledgerBalanceMinor - primaryData.availableBalanceMinor, primaryData.currency)}
            </Text>
          </View>
        )}
        <View className="flex-row gap-2 mt-5">
          <TouchableOpacity
            onPress={() => openExchange('USD')}
            className="flex-1 flex-row items-center justify-center gap-2 bg-white/20 rounded-xl py-3"
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm">Exchange</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openTopUp('USD')}
            className="flex-1 flex-row items-center justify-center gap-2 bg-white/20 rounded-xl py-3"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm">Top Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Secondary Wallets */}
      <Text className="text-gray-700 text-base font-semibold mb-3">Other Wallets</Text>
      {SECONDARY_CURRENCIES.map((code) => {
        const pocket = (balances as any[]).find((b) => b.currency === code);
        const meta = CURRENCY_META[code];
        return (
          <View key={code} className="bg-white border border-gray-100 rounded-2xl px-4 pt-3 pb-3 mb-2">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-[#F0F7F0] items-center justify-center mr-3">
                <Text style={{ fontSize: 20 }}>{meta?.flag ?? '💵'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-sm font-semibold">{meta?.name ?? code}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {formatCurrency(pocket?.availableBalanceMinor ?? 0, code)}
                </Text>
              </View>
              <Text className="text-[#2F6B2F] text-xs font-bold">{code}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => openExchange(code)}
                className="flex-1 flex-row items-center justify-center gap-1 bg-[#F0F7F0] border border-[#2F6B2F]/20 rounded-xl py-2"
              >
                <Ionicons name="swap-horizontal-outline" size={14} color="#2F6B2F" />
                <Text className="text-[#2F6B2F] text-xs font-semibold">Exchange</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openTopUp(code)}
                className="flex-1 flex-row items-center justify-center gap-1 border border-[#2F6B2F] rounded-xl py-2"
              >
                <Ionicons name="add" size={14} color="#2F6B2F" />
                <Text className="text-[#2F6B2F] text-xs font-semibold">Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Recent Activity */}
      <View className="mt-5 mb-4">
        <Text className="text-gray-700 text-base font-semibold mb-3">Recent Activity</Text>
        {recent.length === 0 ? (
          <View className="bg-white border border-gray-100 rounded-2xl p-8 items-center">
            <Ionicons name="receipt-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm mt-2">No transactions yet</Text>
          </View>
        ) : (
          <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {recent.map((tx, idx) => (
              <View
                key={tx.id}
                className={`flex-row items-center px-4 py-3 ${idx < recent.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name="swap-horizontal-outline" size={15} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-sm font-semibold capitalize">
                    {tx.note ?? 'Transfer'}
                  </Text>
                  <Text className="text-gray-400 text-xs">{tx.currency}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 text-sm font-semibold">
                    {formatCurrency(tx.amountMinor, tx.currency)}
                  </Text>
                  <Text className={`text-xs capitalize ${tx.status === 'completed' ? 'text-green-600' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TopUpModal visible={topUpVisible} onClose={() => setTopUpVisible(false)} defaultCurrency={topUpCurrency} />
      <ExchangeModal
        visible={exchangeVisible}
        onClose={() => setExchangeVisible(false)}
        defaultFrom={exchangeFrom}
        balances={balances as any[]}
      />
    </Screen>
  );
}
