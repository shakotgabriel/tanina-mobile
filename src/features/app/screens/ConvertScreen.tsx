import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { notify } from '@/src/lib/utils/notify';

import { Button, EmptyState, Input, Skeleton } from '@/src/components/common';
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
  const [quoteExpiresAtMs, setQuoteExpiresAtMs] = useState<number | null>(null);
  const [quoteExpirySeconds, setQuoteExpirySeconds] = useState(0);

  const amountMinor = useMemo(() => {
    const parsed = Number(fromAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed * 100);
  }, [fromAmount]);

  const isBusy = quoteMutation.isPending || executeMutation.isPending;
  const quoteExpired = Boolean(quote && quoteExpirySeconds <= 0);

  useEffect(() => {
    if (!quoteExpiresAtMs) {
      setQuoteExpirySeconds(0);
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, Math.floor((quoteExpiresAtMs - Date.now()) / 1000));
      setQuoteExpirySeconds(seconds);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quoteExpiresAtMs]);

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
          const expiresAt = data?.quoteExpiresAt ? new Date(data.quoteExpiresAt).getTime() : Date.now() + 60000;
          setQuoteExpiresAtMs(expiresAt);
          notify.success('Quote received');
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
          setQuoteExpiresAtMs(null);
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

    if (quoteExpired) {
      notify.info('Quote expired', 'Request a fresh quote to continue.');
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

        {quoteMutation.isPending ? (
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, gap: 8 }}>
            <Skeleton height={14} width={70} />
            <Skeleton height={14} width="100%" />
            <Skeleton height={14} width="45%" />
          </View>
        ) : quote ? (
          <View style={{ backgroundColor: '#F0F7F0', borderRadius: 12, padding: 12, gap: 6 }}>
            <Text style={{ color: '#111827', fontWeight: '600' }}>Quote</Text>
            <Text style={{ color: '#374151' }}>
              {(quote.fromAmountMinor / 100).toFixed(2)} {quote.fromCurrency} {'->'} {(quote.toAmountMinor / 100).toFixed(2)} {quote.toCurrency}
            </Text>
            <Text style={{ color: '#374151' }}>Rate: {quote.rate}</Text>
            <Text style={{ color: quoteExpired ? '#B91C1C' : '#166534', fontWeight: '600' }}>
              Quote expires in: {quoteExpirySeconds}s
            </Text>
          </View>
        ) : (
          <EmptyState
            title="No quote yet"
            description="Enter amount and currencies, then tap Convert Now to fetch a live rate."
          />
        )}

        <Button onPress={quote ? executeSwap : requestQuote} disabled={isBusy || quoteExpired}>
          {quoteMutation.isPending
            ? 'Fetching quote...'
            : executeMutation.isPending
              ? 'Converting...'
              : quote
                ? 'Convert Now'
                : 'Get Quote'}
        </Button>

        {isBusy ? <ActivityIndicator color="#2F6B2F" /> : null}
      </View>
    </Screen>
  );
}
