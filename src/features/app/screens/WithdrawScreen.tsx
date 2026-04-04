import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '@/src/lib/utils/notify';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
  MOBILE_MONEY_PROVIDERS,
} from '@/src/features/app/components/CountryPicker';
import { useFormValidation } from '@/src/hooks/useFormValidation';
import { useCashoutInitiateMutation, useCashoutConfirmMutation } from '@/src/hooks/useQueries';

type Step = 'select_method' | 'select_country' | 'form';
type WithdrawMethod = 'mobile_money';

const WITHDRAW_METHODS: Method[] = [
  {
    id: 'mobile_money',
    icon: 'phone-portrait-outline',
    title: 'Cashout',
    description: 'Initiate and confirm cashout with OTP',
  },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const initiateCashout = useCashoutInitiateMutation();
  const confirmCashout = useCashoutConfirmMutation();

  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [provider, setProvider] = useState('');
  const [agentUserId, setAgentUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [cashoutId, setCashoutId] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [success, setSuccess] = useState(false);

  const formValues = useMemo(
    () => ({ provider, agentUserId, phone, amount, otp }),
    [provider, agentUserId, phone, amount, otp]
  );
  const { errors, validateField, touchField } = useFormValidation(
    {
      provider: (value) => (String(value).trim() ? null : 'Select a provider'),
      agentUserId: (value) => (String(value).trim() ? null : 'Agent user ID is required'),
      phone: (value) => (String(value).trim().length >= 8 ? null : 'Enter a valid phone number'),
      amount: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? null : 'Amount must be greater than 0';
      },
      otp: (value) => (String(value).trim().length >= 4 ? null : 'Enter a valid OTP'),
    },
    formValues
  );

  function handleBack() {
    if (step === 'form' && method === 'mobile_money') {
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
    setStep('select_country');
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setProvider('');
    setStep('form');
  }

  const handleMobileMoneyWithdraw = () => {
    const providerError = validateField('provider', provider);
    const agentError = validateField('agentUserId', agentUserId);
    const phoneError = validateField('phone', phone);
    const amountError = validateField('amount', amount);

    if (providerError || agentError || phoneError || amountError) {
      notify.validation('Missing fields');
      return;
    }

    if (!country) {
      notify.validation('Select country first');
      return;
    }

    initiateCashout.mutate(
      {
        amountMinor: Math.round(Number(amount) * 100),
        currency: country.code,
        agentId: agentUserId,
      },
      {
        onSuccess: (data: any) => {
          setCashoutId(data.id);
          setOtpStep(true);
          notify.info('Verify with OTP', 'Check your email/SMS for the OTP code');
        },
        onError: () => {
          notify.error('Cashout failed', 'Please try again');
        },
      }
    );
  };

  const handleConfirmCashout = () => {
    if (validateField('otp', otp)) {
      notify.validation('Enter a valid OTP');
      return;
    }

    confirmCashout.mutate(
      {
        id: cashoutId!,
        payload: { confirmationCode: otp },
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: () => {
          notify.error('OTP verification failed', 'Please check your code and try again');
        },
      }
    );
  };

  const stepTitle: Record<Step, string> = {
    select_method: 'Withdraw',
    select_country: 'Select Country',
    form: 'Cashout',
  };

  const providers = country ? MOBILE_MONEY_PROVIDERS[country.code] ?? [] : [];

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={WITHDRAW_METHODS} onSelect={handleMethodSelect} />
      )}

      {step === 'select_country' && (
        <CountryPicker onSelect={handleCountrySelect} selected={country?.code} />
      )}

      {step === 'form' && method === 'mobile_money' && country && (
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setProvider(p.id);
                    touchField('provider');
                    validateField('provider', p.id);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    provider === p.id ? 'bg-[#2F6B2F] border-[#2F6B2F]' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${provider === p.id ? 'text-white' : 'text-gray-700'}`}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.provider ? <Text className="text-red-700 text-xs">{errors.provider}</Text> : null}
          </View>

          <Input
            label="Agent User ID"
            placeholder="e.g. 44444444-4444-4444-4444-444444444444"
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
            label="Mobile Money Number"
            placeholder="e.g. 0700 000 000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              touchField('phone');
              validateField('phone', value);
            }}
            error={errors.phone}
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
          <Button onPress={handleMobileMoneyWithdraw} disabled={initiateCashout.isPending}>
            {initiateCashout.isPending ? 'Requesting OTP...' : 'Continue'}
          </Button>
          {initiateCashout.isPending ? (
            <Text className="text-gray-500 text-xs">Submitting request and waiting for OTP challenge...</Text>
          ) : null}
        </View>
      )}

      {otpStep && !success && (
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
              placeholder={otpStep ? 'Enter 6-digit OTP' : ''}
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(value) => {
                setOtp(value);
                touchField('otp');
                validateField('otp', value);
              }}
              editable={otpStep}
            />
            {errors.otp ? <Text className="text-red-700 text-xs mt-1">{errors.otp}</Text> : null}
            <Text className="text-gray-500 text-xs mt-1">Code expires in 5 minutes.</Text>
          </View>

          <Button onPress={handleConfirmCashout} disabled={confirmCashout.isPending}>
            {confirmCashout.isPending ? 'Verifying...' : 'Confirm Withdrawal'}
          </Button>

          <TouchableOpacity onPress={() => setOtpStep(false)} className="items-center py-2">
            <Text className="text-gray-500 text-sm">Didn&apos;t receive code? Request new one</Text>
          </TouchableOpacity>
        </View>
      )}

      {success && (
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
