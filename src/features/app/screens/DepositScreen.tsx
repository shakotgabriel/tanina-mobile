import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
import { useMobileMoneyDepositMutation } from '@/src/hooks/useQueries';

type Step = 'select_method' | 'select_country' | 'form';
type DepositMethod = 'mobile_money';

const DEPOSIT_METHODS: Method[] = [
  {
    id: 'mobile_money',
    icon: 'phone-portrait-outline',
    title: 'Deposit via Mobile Money',
    description: 'Deposit using mobile money from Uganda, Kenya, Rwanda or South Sudan',
  },
];

export default function DepositScreen() {
  const router = useRouter();
  const deposit = useMobileMoneyDepositMutation();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
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
    setMethod(id as DepositMethod);
    setStep('select_country');
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setProvider('');
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Deposit',
    select_country: 'Select Country',
    form: 'Deposit via Mobile Money',
  };

  const providers = country ? MOBILE_MONEY_PROVIDERS[country.code] ?? [] : [];

  const handleMobileMoneyDeposit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notify.validation('Enter a valid amount');
      return;
    }
    if (!phone.trim()) {
      notify.validation('Enter a phone number');
      return;
    }
    if (!provider) {
      notify.validation('Select a mobile money provider');
      return;
    }
    if (!country) {
      notify.validation('Select country first');
      return;
    }

    const providerName = providers.find((p) => p.id === provider)?.name || provider;

    deposit.mutate(
      {
        amountMinor: Math.round(Number(amount) * 100),
        currency: country.code,
        phoneNumber: phone,
        provider: providerName,
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: () => {
          notify.error('Deposit failed', 'Please try again');
        },
      }
    );
  };

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={DEPOSIT_METHODS} onSelect={handleMethodSelect} />
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
            <Text className="text-gray-700 text-sm font-medium">Mobile Money Network</Text>
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

          <Input
            label="Mobile Money Phone Number"
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
          <Button onPress={handleMobileMoneyDeposit} disabled={deposit.isPending}>
            {deposit.isPending ? 'Processing...' : 'Continue'}
          </Button>
        </View>
      )}

      {success && (
        <View className="flex-1 items-center justify-center py-12 gap-4">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark" size={40} color="#16A34A" />
          </View>
          <Text className="text-gray-900 text-2xl font-bold">Deposit Initiated</Text>
          <Text className="text-gray-500 text-center">
            Your deposit of {amount} {country?.currency} via {providers.find((p) => p.id === provider)?.name} has been initiated.
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
