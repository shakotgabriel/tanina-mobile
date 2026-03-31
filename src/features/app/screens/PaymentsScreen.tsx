import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';

type Step = 'select_method' | 'form';
type PaymentMethod = 'utilities' | 'merchant';

const PAYMENT_METHODS: Method[] = [
  {
    id: 'utilities',
    icon: 'flash-outline',
    title: 'Pay Utilities',
    description: 'Pay electricity, water and other utility bills',
  },
  {
    id: 'merchant',
    icon: 'storefront-outline',
    title: 'Pay Merchant',
    description: 'Pay a business or merchant account',
  },
];

const UTILITY_PROVIDERS = [
  { id: 'umeme', name: 'UMEME Electricity', icon: 'flash-outline' as const },
  { id: 'nwsc', name: 'Nile Water (NWSC)', icon: 'water-outline' as const },
  { id: 'kplc', name: 'Kenya Power (KPLC)', icon: 'flash-outline' as const },
  { id: 'reco', name: 'Rwanda Electricity (RECO)', icon: 'flash-outline' as const },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [utilityProvider, setUtilityProvider] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [merchantCode, setMerchantCode] = useState('');
  const [amount, setAmount] = useState('');

  function handleBack() {
    if (step === 'form') {
      setStep('select_method');
    } else {
      router.back();
    }
  }

  function handleMethodSelect(id: string) {
    setMethod(id as PaymentMethod);
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Payments',
    form: method === 'utilities' ? 'Pay Utilities' : 'Pay Merchant',
  };

  return (
    <ActionScreen title={stepTitle[step]} onBack={handleBack}>
      {step === 'select_method' && (
        <MethodSelector methods={PAYMENT_METHODS} onSelect={handleMethodSelect} />
      )}

      {step === 'form' && method === 'utilities' && (
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-gray-700 text-sm font-medium">Utility Provider</Text>
            <View className="gap-2">
              {UTILITY_PROVIDERS.map((up) => (
                <TouchableOpacity
                  key={up.id}
                  onPress={() => setUtilityProvider(up.id)}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-3 bg-white rounded-2xl p-4 border ${
                    utilityProvider === up.id ? 'border-[#2F6B2F]' : 'border-gray-100'
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      utilityProvider === up.id ? 'bg-[#2F6B2F]' : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name={up.icon}
                      size={18}
                      color={utilityProvider === up.id ? '#FFFFFF' : '#6B7280'}
                    />
                  </View>
                  <Text
                    className={`flex-1 text-sm font-medium ${
                      utilityProvider === up.id ? 'text-[#2F6B2F]' : 'text-gray-800'
                    }`}
                  >
                    {up.name}
                  </Text>
                  {utilityProvider === up.id && (
                    <Ionicons name="checkmark-circle" size={18} color="#2F6B2F" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Meter / Account Number"
            placeholder="Enter meter or account number"
            keyboardType="number-pad"
            value={meterNumber}
            onChangeText={setMeterNumber}
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

      {step === 'form' && method === 'merchant' && (
        <View className="gap-4">
          <View className="bg-[#2F6B2F]/5 rounded-xl p-4 mb-1">
            <Text className="text-gray-700 text-sm font-medium mb-1">How it works</Text>
            <Text className="text-gray-500 text-xs leading-relaxed">
              Enter the merchant code provided by the business. The merchant name will be shown for you to confirm before payment.
            </Text>
          </View>
          <Input
            label="Merchant Code"
            placeholder="e.g. MERCH-001234"
            autoCapitalize="characters"
            value={merchantCode}
            onChangeText={setMerchantCode}
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
    </ActionScreen>
  );
}
