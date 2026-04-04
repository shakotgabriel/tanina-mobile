import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { notify } from '@/src/lib/utils/notify';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useFxExecuteMutation, useFxQuoteMutation } from '@/src/hooks/useQueries';

const CURRENCIES = ['USD', 'KES', 'SSP', 'UGX', 'RWF'];

export default function ConvertScreen() {
  const quoteMutation = useFxQuoteMutation();
  const executeMutation = useFxExecuteMutation();

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KES');
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<any | null>(null);

  const amountMinor = useMemo(() => {
    const parsed = Number(fromAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed * 100);
  }, [fromAmount]);

  const isBusy = quoteMutation.isPending || executeMutation.isPending;

  const requestQuote = () => {
    if (fromCurrency === toCurrency) {
      notify.validation('Choose different currencies');
      return;
    }
    if (!amountMinor) {
      notify.validation('Enter a valid amount');
      return;
    }

    quoteMutation.mutate(
      {
        fromCurrency,
        toCurrency,
        fromAmountMinor: amountMinor,
      },
      {
        onSuccess: (data: any) => {
          setQuote(data);
          notify.success('Quote received');

          if (data?.swapRequestId && data?.fxSnapshotId) {
            performExecute(data.swapRequestId, data.fxSnapshotId);
          }
        },
        onError: () => {
          notify.error('Quote failed');
        },
      }
    );
  };

  const performExecute = (swapRequestId: string, fxSnapshotId: string) => {
    executeMutation.mutate(
      {
        payload: {
          swapRequestId,
          fxSnapshotId,
        },
        swapRequestId,
      },
      {
        onSuccess: () => {
          notify.success('Conversion completed');
          setQuote(null);
          setFromAmount('');
        },
        onError: () => {
          notify.error('Conversion failed');
        },
      }
    );
  };

  const executeSwap = () => {
    if (!quote?.swapRequestId || !quote?.fxSnapshotId) {
      notify.validation('Request a quote first');
      return;
    }

    performExecute(quote.swapRequestId, quote.fxSnapshotId);
  };

  return (
    <Screen scrollable>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Convert currency</Text>

        <Input
          label="From amount"
          keyboardType="decimal-pad"
          value={fromAmount}
          onChangeText={setFromAmount}
          placeholder="0.00"
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>From currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={`from-${currency}`}
                onPress={() => setFromCurrency(currency)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: fromCurrency === currency ? '#2F6B2F' : '#F3F4F6',
                }}
              >
                <Text style={{ color: fromCurrency === currency ? '#FFF' : '#111827', fontWeight: '600' }}>{currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>To currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={`to-${currency}`}
                onPress={() => setToCurrency(currency)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: toCurrency === currency ? '#2F6B2F' : '#F3F4F6',
                }}
              >
                <Text style={{ color: toCurrency === currency ? '#FFF' : '#111827', fontWeight: '600' }}>{currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {quote && (
          <View style={{ backgroundColor: '#F0F7F0', borderRadius: 12, padding: 12, gap: 6 }}>
            <Text style={{ color: '#111827', fontWeight: '600' }}>Quote</Text>
            <Text style={{ color: '#374151' }}>
              {(quote.fromAmountMinor / 100).toFixed(2)} {quote.fromCurrency} {'->'} {(quote.toAmountMinor / 100).toFixed(2)} {quote.toCurrency}
            </Text>
            <Text style={{ color: '#374151' }}>Rate: {quote.rate}</Text>
          </View>
        )}

        <Button onPress={quote ? executeSwap : requestQuote} disabled={isBusy}>
          {isBusy ? 'Processing...' : quote ? 'Convert Now' : 'Convert Now'}
        </Button>

        {isBusy ? <ActivityIndicator color="#2F6B2F" /> : null}
      </View>
    </Screen>
  );
}
