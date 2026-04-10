import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '@/src/lib/utils/notify';

import { Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
} from '@/src/features/app/components/CountryPicker';
import { useFormValidation } from '@/src/hooks/useFormValidation';
import { useWithdrawalInitiateMutation, useWithdrawalConfirmMutation } from '@/src/hooks/useQueries';

type Step = 'select_method' | 'select_country' | 'form';
type WithdrawMethod = 'agent';
type WithdrawPhase = 'entry' | 'otp' | 'success';

const WITHDRAW_METHODS: Method[] = [
  {
    id: 'agent',
    icon: 'person-outline',
    title: 'Withdraw via Agent',
    description: 'Initiate and confirm withdrawal with OTP',
  },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const initiateWithdrawal = useWithdrawalInitiateMutation();
  const confirmWithdrawal = useWithdrawalConfirmMutation();

  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [agentUserId, setAgentUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [phase, setPhase] = useState<WithdrawPhase>('entry');

  const formValues = useMemo(
    () => ({ agentUserId, amount, otp }),
    [agentUserId, amount, otp]
  );
  const { errors, validateField, touchField } = useFormValidation(
    {
      agentUserId: (value) => (String(value).trim() ? null : 'Withdrawal agent code is required'),
      amount: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? null : 'Amount must be greater than 0';
      },
      otp: (value) => (String(value).trim().length >= 4 ? null : 'Enter a valid OTP'),
    },
    formValues
  );

  const extractErrorMessage = (error: unknown, fallback: string) => {
    const data = (error as any)?.response?.data;
    const message = data?.message ?? data?.error ?? (error as any)?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  };

  function handleBack() {
    if (step === 'form' && phase === 'otp') {
      setPhase('entry');
      setOtp('');
    } else if (step === 'form' && phase === 'success') {
      router.back();
    } else if (step === 'form' && method === 'agent') {
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
    setMethod(id as WithdrawMethod);
    setPhase('entry');
    setOtp('');
    setWithdrawalId(null);
    setStep('select_country');
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setPhase('entry');
    setOtp('');
    setWithdrawalId(null);
    setStep('form');
  }

  const handleAgentWithdraw = () => {
    const agentError = validateField('agentUserId', agentUserId);
    const amountError = validateField('amount', amount);

    if (agentError || amountError) {
      notify.validation('Missing fields');
      return;
    }

    if (!country) {
      notify.validation('Select country first');
      return;
    }

    initiateWithdrawal.mutate(
      {
        amountMinor: Math.round(Number(amount) * 100),
        currency: country.currency,
        agentId: agentUserId,
      },
      {
        onSuccess: (data: any) => {
          const nextWithdrawalId = data?.id ?? data?.cashoutId ?? data?.withdrawalId;
          if (!nextWithdrawalId) {
            notify.error('Withdrawal request failed', 'Unable to start OTP verification');
            return;
          }

          setWithdrawalId(nextWithdrawalId);
          setPhase('otp');
          notify.info('Verify with OTP', 'Check your email/SMS for the OTP code');
        },
        onError: (error) => {
          notify.error('Withdrawal request failed', extractErrorMessage(error, 'Please try again'));
        },
      }
    );
  };

  const handleConfirmWithdrawal = () => {
    if (!withdrawalId) {
      notify.error('Withdrawal request failed', 'Start a withdrawal request first');
      setPhase('entry');
      return;
    }

    if (validateField('otp', otp)) {
      notify.validation('Enter a valid OTP');
      return;
    }

    confirmWithdrawal.mutate(
      {
        id: withdrawalId!,
        payload: { otp },
      },
      {
        onSuccess: () => {
          setPhase('success');
        },
        onError: (error) => {
          notify.error('OTP verification failed', extractErrorMessage(error, 'Please check your code and try again'));
        },
      }
    );
  };

  const stepTitle: Record<Step, string> = {
    select_method: 'Withdraw',
    select_country: 'Select Country',
    form: 'Withdraw via Agent',
  };

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={WITHDRAW_METHODS} onSelect={handleMethodSelect} />
      )}

      {step === 'select_country' && (
        <CountryPicker onSelect={handleCountrySelect} selected={country?.code} />
      )}

      {step === 'form' && method === 'agent' && country && phase === 'entry' && (
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

          <Input
            label="Withdrawal Agent Code"
            placeholder="e.g. 660106"
            autoCapitalize="none"
            value={agentUserId}
            onChangeText={(value) => {
              setAgentUserId(value);
              touchField('agentUserId');
              validateField('agentUserId', value);
            }}
            error={errors.agentUserId}
          />
          <Input
            label={`Amount (${country.currency})`}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              touchField('amount');
              validateField('amount', value);
            }}
            error={errors.amount}
          />
          <TouchableOpacity
            onPress={handleAgentWithdraw}
            disabled={initiateWithdrawal.isPending}
            activeOpacity={0.85}
            style={[styles.ctaButton, initiateWithdrawal.isPending && styles.ctaDisabled]}
          >
            <Text style={styles.ctaButtonLabel}>
              {initiateWithdrawal.isPending ? 'Requesting OTP...' : 'Continue'}
            </Text>
          </TouchableOpacity>
          {initiateWithdrawal.isPending ? (
            <Text className="text-gray-500 text-xs">Submitting request and waiting for OTP challenge...</Text>
          ) : null}
        </View>
      )}

      {step === 'form' && phase === 'otp' && (
        <View className="gap-4">
          <View className="items-center py-6">
            <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-3">
              <Ionicons name="lock-closed-outline" size={28} color="#F59E0B" />
            </View>
            <Text className="text-gray-900 text-lg font-bold">Verify Withdrawal</Text>
            <Text className="text-gray-500 text-sm text-center mt-2">
              Enter the OTP code sent to your registered phone number
            </Text>
          </View>

          <View className="gap-1">
            <Text className="text-gray-700 text-sm font-medium">OTP Code</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-lg tracking-widest font-bold text-center"
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(value) => {
                setOtp(value);
                touchField('otp');
                validateField('otp', value);
              }}
              editable
            />
            {errors.otp ? <Text className="text-red-700 text-xs mt-1">{errors.otp}</Text> : null}
            <Text className="text-gray-500 text-xs mt-1">Code expires in 5 minutes.</Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirmWithdrawal}
            disabled={confirmWithdrawal.isPending}
            activeOpacity={0.85}
            style={[styles.ctaButton, confirmWithdrawal.isPending && styles.ctaDisabled]}
          >
            <Text style={styles.ctaButtonLabel}>
              {confirmWithdrawal.isPending ? 'Verifying...' : 'Confirm Withdrawal'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPhase('entry');
              setOtp('');
              setWithdrawalId(null);
            }}
            className="items-center py-2">
            <Text className="text-gray-500 text-sm">Didn&apos;t receive code? Request new one</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'form' && phase === 'success' && (
        <View className="flex-1 items-center justify-center py-12 gap-4">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark" size={40} color="#16A34A" />
          </View>
          <Text className="text-gray-900 text-2xl font-bold">Withdrawal Confirmed</Text>
          <Text className="text-gray-500 text-center">
            Your withdrawal of {amount} {country?.currency} has been confirmed and is being processed.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full bg-[#2F6B2F] rounded-xl py-4 items-center mt-4"
          >
            <Text className="text-white font-bold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ActionScreen>
  );
}

const styles = StyleSheet.create({
  ctaButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#2F6B2F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
