import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '@/src/lib/utils/notify';

import ActionScreen from '@/src/components/layout/ActionScreen';
import { MOBILE_MONEY_PROVIDERS, SUPPORTED_COUNTRIES } from '@/src/features/app/components/CountryPicker';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import { useFxQuoteMutation, useLookupUserMutation, useSendP2PMutation } from '@/src/hooks/useQueries';
import { UserDTO } from '@/src/types';
import { formatCurrency } from '@/src/lib/utils/currency';

type Step = 'select_method' | 'form';
type SendMethod = 'to_user' | 'international';

const SEND_METHODS: Method[] = [
  {
    id: 'to_user',
    icon: 'person-outline',
    title: 'Send to User',
    description: 'Send money using their email address',
  },
  {
    id: 'international',
    icon: 'airplane-outline',
    title: 'International Transfer',
    description: 'Send to mobile money numbers in another country with FX quote',
  },
];

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'SSP', flag: '🇸🇸' },
  { code: 'KES', flag: '🇰🇪' },
  { code: 'UGX', flag: '🇺🇬' },
  { code: 'RWF', flag: '🇷🇼' },
];

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  KE: 'KES',
  UG: 'UGX',
  SS: 'SSP',
  RW: 'RWF',
};

function CountryChipList({ selected, onSelect }: { selected: string; onSelect: (code: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {SUPPORTED_COUNTRIES.map((country) => {
          const active = selected === country.code;
          return (
            <TouchableOpacity
              key={country.code}
              onPress={() => onSelect(country.code)}
              activeOpacity={0.8}
              style={[
                styles.currencyChip,
                active && styles.currencyChipActive,
                { alignItems: 'center', flexDirection: 'row' },
              ]}
            >
              <Text style={{ fontSize: 16, marginRight: 5 }}>{country.flag}</Text>
              <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>
                {country.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function P2PSendForm({ onDone }: { onDone: () => void }) {
  const lookup = useLookupUserMutation();
  const send = useSendP2PMutation();

  const [email, setEmail] = useState('');
  const [recipient, setRecipient] = useState<UserDTO | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [done, setDone] = useState(false);

  async function handleLookup() {
    if (!email.trim()) return;
    lookup.mutate(email.trim(), {
      onSuccess: (user) => setRecipient(user as UserDTO),
      onError: () => {
        setRecipient(null);
        notify.error('User not found', 'No Tanina account found for that email.');
      },
    });
  }

  function handleReview() {
    if (!recipient) return;
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      notify.validation('Invalid amount');
      return;
    }
    setConfirmVisible(true);
  }

  function handleConfirm() {
    if (!recipient?.userId) return;
    const amountMinor = Math.round(parseFloat(amount) * 100);
    send.mutate(
      { toUserId: recipient.userId, amountMinor, currency, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setConfirmVisible(false);
          setDone(true);
        },
        onError: () => {
          setConfirmVisible(false);
          notify.error('Transfer failed', 'Please check your balance and try again.');
        },
      }
    );
  }

  if (done) {
    return (
      <View style={styles.successBox}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Sent!</Text>
        <Text style={styles.successSub}>
          {amount} {currency} sent to {recipient?.firstName} {recipient?.lastName}
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* ── Email lookup ───────────────────────── */}
      <Text style={styles.label}>Recipient email</Text>
      <View style={styles.lookupRow}>
        <TextInput
          style={styles.lookupInput}
          placeholder="e.g. john@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={(v) => { setEmail(v); setRecipient(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!lookup.isPending}
        />
        <TouchableOpacity
          style={[styles.findBtn, lookup.isPending && { opacity: 0.6 }]}
          onPress={handleLookup}
          disabled={lookup.isPending || !email.trim()}
          activeOpacity={0.8}
        >
          {lookup.isPending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.findBtnText}>Find</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Recipient card ─────────────────────── */}
      {recipient && (
        <View style={styles.recipientCard}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientInitials}>
              {(recipient.firstName?.[0] ?? '') + (recipient.lastName?.[0] ?? '')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientName}>
              {recipient.firstName} {recipient.lastName}
            </Text>
            <Text style={styles.recipientEmail}>{recipient.email}</Text>
          </View>
          <View style={styles.recipientBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#2F6B2F" />
            <Text style={styles.recipientBadgeText}>Verified</Text>
          </View>
        </View>
      )}

      {/* ── Currency ───────────────────────────── */}
      {recipient && (
        <>
          <Text style={[styles.label, { marginTop: 20 }]}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CURRENCIES.map(({ code, flag }) => {
                const active = currency === code;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setCurrency(code)}
                    activeOpacity={0.8}
                    style={[styles.currencyChip, active && styles.currencyChipActive]}
                  >
                    <Text style={{ fontSize: 16, marginRight: 5 }}>{flag}</Text>
                    <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Amount ───────────────────────────── */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyTag}>{currency}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* ── Note ─────────────────────────────── */}
          <Text style={[styles.label, { marginTop: 18 }]}>Note <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What's this for?"
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            maxLength={120}
          />

          {/* ── Review button ────────────────────── */}
          <TouchableOpacity style={styles.reviewBtn} onPress={handleReview} activeOpacity={0.85}>
            <Text style={styles.reviewBtnText}>Review Transfer</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      {/* ── Confirm modal ────────────────────────── */}
      <Modal visible={confirmVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm Transfer</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>To</Text>
              <Text style={styles.summaryValue}>
                {recipient?.firstName} {recipient?.lastName}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email</Text>
              <Text style={styles.summaryValue}>{recipient?.email}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryAmountValue}>{amount} {currency}</Text>
            </View>
            {note.trim() !== '' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Note</Text>
                <Text style={styles.summaryValue}>{note}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, send.isPending && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={send.isPending}
              activeOpacity={0.85}
            >
              {send.isPending
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.confirmBtnText}>Confirm & Send</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setConfirmVisible(false)}
              disabled={send.isPending}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InternationalTransferForm({ onDone }: { onDone: () => void }) {
  const fxQuote = useFxQuoteMutation();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [destinationCountry, setDestinationCountry] = useState('KE');
  const [providerId, setProviderId] = useState(MOBILE_MONEY_PROVIDERS.KE[0].id);
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [done, setDone] = useState(false);

  const destinationCurrency = COUNTRY_TO_CURRENCY[destinationCountry] ?? 'KES';
  const providers = MOBILE_MONEY_PROVIDERS[destinationCountry as keyof typeof MOBILE_MONEY_PROVIDERS] ?? [];
  const selectedProvider = providers.find((provider) => provider.id === providerId) ?? providers[0];
  const amountMinor = Math.round(Number(amount || '0') * 100);
  const estimatedReceive = quote?.toAmountMinor ? formatCurrency(quote.toAmountMinor, destinationCurrency) : '—';

  function resetQuote() {
    setQuote(null);
    setShowSummary(false);
  }

  function handleQuote() {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      notify.validation('Invalid amount');
      return;
    }

    fxQuote.mutate(
      {
        fromCurrency,
        toCurrency: destinationCurrency,
        fromAmountMinor: amountMinor,
      },
      {
        onSuccess: (data) => {
          setQuote(data);
          setShowSummary(true);
        },
        onError: () => {
          notify.error('Quote failed', 'Unable to fetch exchange rate.');
        },
      }
    );
  }

  function handleConfirm() {
    if (!quote) {
      handleQuote();
      return;
    }

    setShowSummary(false);
    setTimeout(() => {
      setDone(true);
      notify.success('Transfer queued', 'Demo payout created for the investors presentation.');
    }, 650);
  }

  if (done) {
    return (
      <View style={styles.successBox}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Sent!</Text>
        <Text style={styles.successSub}>
          Demo transfer to {mobileNumber} via {selectedProvider?.name ?? 'mobile money'} in {destinationCountry}
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Send from</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CURRENCIES.map(({ code, flag }) => {
            const active = fromCurrency === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => { setFromCurrency(code); resetQuote(); }}
                activeOpacity={0.8}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
              >
                <Text style={{ fontSize: 16, marginRight: 5 }}>{flag}</Text>
                <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>{code}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.label}>Destination country</Text>
      <CountryChipList
        selected={destinationCountry}
        onSelect={(code) => {
          setDestinationCountry(code);
          const nextProvider = MOBILE_MONEY_PROVIDERS[code as keyof typeof MOBILE_MONEY_PROVIDERS]?.[0]?.id;
          if (nextProvider) {
            setProviderId(nextProvider);
          }
          resetQuote();
        }}
      />

      <Text style={styles.label}>Mobile money provider</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {providers.map((provider) => {
            const active = providerId === provider.id;
            return (
              <TouchableOpacity
                key={provider.id}
                onPress={() => {
                  setProviderId(provider.id);
                  resetQuote();
                }}
                activeOpacity={0.8}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
              >
                <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>{provider.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.label}>Recipient mobile number</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="e.g. +254 7XX XXX XXX"
        placeholderTextColor="#9CA3AF"
        value={mobileNumber}
        onChangeText={(value) => {
          setMobileNumber(value);
          resetQuote();
        }}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currencyTag}>{fromCurrency}</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            resetQuote();
          }}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={{ backgroundColor: '#F0F7F0', borderWidth: 1, borderColor: '#2F6B2F1A', borderRadius: 16, padding: 14, marginTop: 8, marginBottom: 18 }}>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Transfer preview</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
          {quote ? `${quote.fromCurrency} ${Number(amount || 0).toFixed(2)} → ${destinationCurrency} ${Number(quote.toAmountMinor / 100).toFixed(2)}` : 'Request a quote to preview the payout'}
        </Text>
        {quote && (
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Rate: 1 {quote.fromCurrency} = {Number(quote.rate).toFixed(2)} {quote.toCurrency}
          </Text>
        )}
        {quote && (
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Provider: {selectedProvider?.name ?? 'Mobile money'} · Network fee included in demo flow
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.reviewBtn} onPress={quote ? handleConfirm : handleQuote} activeOpacity={0.85}>
        {fxQuote.isPending
          ? <ActivityIndicator color="#FFFFFF" />
          : (
            <>
              <Text style={styles.reviewBtnText}>{quote ? 'Confirm Transfer' : 'Get FX Quote'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
      </TouchableOpacity>

      <Modal visible={showSummary} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm International Transfer</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Destination</Text>
              <Text style={styles.summaryValue}>{destinationCountry}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider</Text>
              <Text style={styles.summaryValue}>{selectedProvider?.name ?? 'Mobile money'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recipient</Text>
              <Text style={styles.summaryValue}>{mobileNumber}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
              <Text style={styles.summaryLabel}>Send</Text>
              <Text style={styles.summaryAmountValue}>{fromCurrency} {Number(amount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Receive</Text>
              <Text style={styles.summaryValue}>{estimatedReceive}</Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm Demo Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSummary(false)}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default function SendScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<SendMethod | null>(null);

  function handleBack() {
    if (step === 'form') {
      setStep('select_method');
    } else {
      router.back();
    }
  }

  function handleMethodSelect(id: string) {
    setMethod(id as SendMethod);
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Send Money',
    form: method === 'international' ? 'International Transfer' : 'Send to User',
  };

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={SEND_METHODS} onSelect={handleMethodSelect} />
      )}

      {step === 'form' && method === 'to_user' && (
        <P2PSendForm onDone={() => { setStep('select_method'); setMethod(null); }} />
      )}

      {step === 'form' && method === 'international' && (
        <InternationalTransferForm onDone={() => { setStep('select_method'); setMethod(null); }} />
      )}
    </ActionScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  lookupRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  lookupInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
  },
  findBtn: {
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  findBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F0',
    borderWidth: 1.5,
    borderColor: '#2F6B2F',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F6B2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInitials: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  recipientName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  recipientEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  recipientBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recipientBadgeText: { fontSize: 11, color: '#2F6B2F', fontWeight: '600' },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  currencyChipActive: { borderColor: '#2F6B2F', backgroundColor: '#F0F7F0' },
  currencyChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  currencyChipTextActive: { color: '#2F6B2F' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  currencyTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F6B2F',
    marginRight: 10,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingRight: 12,
  },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: 22, fontWeight: '700', color: '#111827' },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 24,
  },
  reviewBtn: {
    flexDirection: 'row',
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 4px 8px rgba(47, 107, 47, 0.25)',
    elevation: 4,
    marginBottom: 32,
  },
  reviewBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryRowHighlight: { backgroundColor: '#F0F7F0', borderRadius: 10, paddingHorizontal: 10, marginVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#111827', fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  summaryAmountValue: { fontSize: 20, color: '#2F6B2F', fontWeight: '800' },
  confirmBtn: {
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2F6B2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  doneBtn: {
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 48,
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
