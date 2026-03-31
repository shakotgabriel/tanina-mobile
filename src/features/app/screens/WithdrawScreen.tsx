import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
  MOBILE_MONEY_PROVIDERS,
} from '@/src/features/app/components/CountryPicker';

type Step = 'select_method' | 'select_country' | 'form';
type WithdrawMethod = 'agent' | 'mobile_money' | 'bank';

const WITHDRAW_METHODS: Method[] = [
  {
    id: 'agent',
    icon: 'person-circle-outline',
    title: 'Withdraw to Agent',
    description: 'Collect cash from a nearby agent',
  },
  {
    id: 'mobile_money',
    icon: 'phone-portrait-outline',
    title: 'Withdraw to Mobile Money',
    description: 'Send funds directly to your mobile wallet',
  },
  {
    id: 'bank',
    icon: 'business-outline',
    title: 'Withdraw to Bank',
    description: 'Transfer funds to your bank account',
  },
];

const BANKS = ['Equity Bank', 'KCB Bank', 'Centenary Bank', 'Stanbic Bank', 'ABSA Bank'];

export default function WithdrawScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [provider, setProvider] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

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
    if (id === 'mobile_money') {
      setStep('select_country');
    } else {
      setStep('form');
    }
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setProvider('');
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Withdraw',
    select_country: 'Select Country',
    form:
      method === 'agent'
        ? 'Withdraw to Agent'
        : method === 'bank'
        ? 'Withdraw to Bank'
        : 'Withdraw to Mobile Money',
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

      {step === 'form' && method === 'agent' && (
        <View className="gap-4">
          <Input
            label="Agent Code"
            placeholder="e.g. 123456"
            keyboardType="number-pad"
            value={agentCode}
            onChangeText={setAgentCode}
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

      {step === 'form' && method === 'bank' && (
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-gray-700 text-sm font-medium">Select Bank</Text>
            <View className="gap-2">
              {BANKS.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setBank(b)}
                  className={`flex-row items-center justify-between bg-white rounded-xl p-3 border ${
                    bank === b ? 'border-[#2F6B2F]' : 'border-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${bank === b ? 'text-[#2F6B2F]' : 'text-gray-700'}`}
                  >
                    {b}
                  </Text>
                  {bank === b && <Ionicons name="checkmark-circle" size={18} color="#2F6B2F" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Input
            label="Account Number"
            placeholder="Enter account number"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
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
          <Button onPress={() => {}}>Continue</Button>
        </View>
      )}
    </ActionScreen>
  );
}
