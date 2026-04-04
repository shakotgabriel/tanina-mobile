import { useState } from 'react';
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
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notify.validation('Enter a valid amount');
      return;
    }
    if (!phone.trim()) {
      notify.validation('Enter a phone number');
      return;
    }
    if (!provider) {
      notify.validation('Select a provider');
      return;
    }

    if (!agentUserId.trim()) {
      notify.validation('Enter agent user ID');
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
    if (!otp || otp.length < 4) {
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
                  onPress={() => setProvider(p.id)}
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
          </View>

          <Input
            label="Agent User ID"
            placeholder="e.g. 44444444-4444-4444-4444-444444444444"
            autoCapitalize="none"
            value={agentUserId}
            onChangeText={setAgentUserId}
          />
          <Input
            label="Mobile Money Number"
            placeholder="e.g. 0700 000 000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Input
            label={`Amount (${country.currency})`}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Button onPress={handleMobileMoneyWithdraw} disabled={initiateCashout.isPending}>
            {initiateCashout.isPending ? 'Processing...' : 'Continue'}
          </Button>
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
              placeholder="0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
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
