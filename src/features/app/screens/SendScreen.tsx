import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
  MOBILE_MONEY_PROVIDERS,
} from '@/src/features/app/components/CountryPicker';

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

export default function SendScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<SendMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [provider, setProvider] = useState('');
  const [email, setEmail] = useState('');
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
        <View className="gap-4">
          <Input
            label="Recipient Email"
            placeholder="e.g. john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Amount (USD)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Button onPress={() => {}}>Continue</Button>
        </View>
      )}

      {step === 'form' && method === 'international' && country && (
        <View className="gap-4">
          <View className="flex-row items-center gap-3 bg-[#2F6B2F]/5 rounded-xl p-3 mb-1">
            <Text style={{ fontSize: 24 }}>{country.flag}</Text>
            <View>
              <Text className="text-gray-900 text-sm font-semibold">{country.name}</Text>
              <Text className="text-gray-400 text-xs">{country.currency}</Text>
            </View>
            <TouchableOpacity
              className="ml-auto"
              onPress={() => setStep('select_country')}
            >
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
                    provider === p.id
                      ? 'bg-[#2F6B2F] border-[#2F6B2F]'
                      : 'bg-white border-gray-200'
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
            label="Recipient Phone Number"
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
          <Button onPress={() => {}}>Continue</Button>
        </View>
      )}
    </ActionScreen>
  );
}
