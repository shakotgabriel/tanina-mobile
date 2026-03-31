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
import Toast from 'react-native-toast-message';

import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
  MOBILE_MONEY_PROVIDERS,
} from '@/src/features/app/components/CountryPicker';
import { useLookupUserMutation, useSendP2PMutation } from '@/src/hooks/useQueries';
import { UserDTO } from '@/src/types';

type Step = 'select_method' | 'select_country' | 'form';
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
    icon: 'globe-outline',
    title: 'International Transfer',
    description: 'Send to Uganda, Kenya, Rwanda or South Sudan',
  },
];

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'SSP', flag: '🇸🇸' },
  { code: 'KSH', flag: '🇰🇪' },
  { code: 'UGX', flag: '🇺🇬' },
  { code: 'RWF', flag: '🇷🇼' },
];

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
        Toast.show({ type: 'error', text1: 'User not found', text2: 'No Tanina account found for that email.' });
      },
    });
  }

  function handleReview() {
    if (!recipient) return;
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid amount', text2: 'Enter a valid amount greater than 0.' });
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
          Toast.show({ type: 'error', text1: 'Transfer failed', text2: 'Please check your balance and try again.' });
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

export default function SendScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<SendMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  function handleBack() {
    if (step === 'form' && method === 'international') {
      setStep('select_country');
    } else if (step === 'select_country') {
      setStep('select_method');
    } else if (step === 'form') {
      setStep('select_method');
    } else {
      router.back();
    }
  }

  function handleMethodSelect(id: string) {
    setMethod(id as SendMethod);
    if (id === 'to_user') {
      setStep('form');
    } else {
      setStep('select_country');
    }
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setProvider('');
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Send Money',
    select_country: 'Select Country',
    form: method === 'to_user' ? 'Send to User' : `Send to ${country?.name ?? ''}`,
  };

  const providers = country ? MOBILE_MONEY_PROVIDERS[country.code] ?? [] : [];

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={SEND_METHODS} onSelect={handleMethodSelect} />
      )}

      {step === 'select_country' && (
        <CountryPicker onSelect={handleCountrySelect} selected={country?.code} />
      )}

      {step === 'form' && method === 'to_user' && (
        <P2PSendForm onDone={() => { setStep('select_method'); setMethod(null); }} />
      )}

      {step === 'form' && method === 'international' && country && (
        <View className="gap-4">
          <View className="flex-row items-center gap-3 bg-[#2F6B2F]/5 rounded-xl p-3 mb-1">
            <Text style={{ fontSize: 24 }}>{country.flag}</Text>
            <View>
              <Text className="text-gray-900 text-sm font-semibold">{country.name}</Text>
              <Text className="text-gray-400 text-xs">{country.currency}</Text>
            </View>
            <TouchableOpacity className="ml-auto" onPress={() => setStep('select_country')}>
              <Text className="text-[#2F6B2F] text-xs font-medium">Change</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            <Text className="text-gray-700 text-sm font-medium">Mobile Money Provider</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setProvider(p.id)}
                  className={`px-4 py-2 rounded-full border ${
                    provider === p.id ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${provider === p.id ? 'text-white' : 'text-gray-700'}`}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="gap-1">
            <Text className="text-gray-700 text-sm font-medium">Recipient Phone Number</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
              placeholder="e.g. 0700 000 000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View className="gap-1">
            <Text className="text-gray-700 text-sm font-medium">Amount ({country.currency})</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <TouchableOpacity className="bg-[#2F6B2F] rounded-xl py-4 items-center mt-2">
            <Text className="text-white font-bold text-base">Continue</Text>
          </TouchableOpacity>
        </View>
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
    shadowColor: '#2F6B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
