import { useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '@/src/lib/utils/notify';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import { useBillPayMutation, useBalancesQuery, useMerchantPayMutation } from '@/src/hooks/useQueries';
import { formatCurrency } from '@/src/lib/utils/currency';

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
  const billPay = useBillPayMutation();
  const merchantPay = useMerchantPayMutation();
  const { data: balances = [] } = useBalancesQuery(true); // Enable query to display current balances

  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [utilityProvider, setUtilityProvider] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [merchantCode, setMerchantCode] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [success, setSuccess] = useState(false);

  const primaryBalance = (balances as any[]).find((b) => b.currency === 'USD');

  const handlePayBill = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notify.validation('Enter a valid amount');
      return;
    }

    if (!meterNumber.trim()) {
      notify.validation('Enter meter/account number');
      return;
    }

    setConfirmVisible(true);
  };

  const handleConfirmPayment = () => {
    if (method === 'merchant') {
      merchantPay.mutate(
        {
          merchantId: merchantCode,
          amountMinor: Math.round(Number(amount) * 100),
          currency: 'USD',
        },
        {
          onSuccess: () => {
            setConfirmVisible(false);
            setSuccess(true);
          },
          onError: () => {
            notify.error('Merchant payment failed', 'Check merchant ID and try again');
          },
        }
      );
      return;
    }

    const provider = UTILITY_PROVIDERS.find((p) => p.id === utilityProvider);
    billPay.mutate(
      {
        billType: 'UTILITY',
        accountNumber: meterNumber,
        amountMinor: Math.round(Number(amount) * 100),
        currency: 'USD',
        provider: provider?.name || utilityProvider,
      },
      {
        onSuccess: () => {
          setConfirmVisible(false);
          setSuccess(true);
        },
        onError: () => {
          notify.error('Payment failed', 'Please check your balance and try again');
        },
      }
    );
  };

  const handlePayMerchant = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notify.validation('Enter a valid amount');
      return;
    }
    if (!merchantCode.trim()) {
      notify.validation('Enter merchant code or ID');
      return;
    }
    setConfirmVisible(true);
  };

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
          <Button onPress={handlePayBill}>Continue</Button>
        </View>
      )}

      {step === 'form' && method === 'merchant' && (
        <View className="gap-4">
          <View className="bg-[#2F6B2F]/5 rounded-xl p-4 mb-1">
            <Text className="text-gray-700 text-sm font-medium mb-1">How it works</Text>
            <Text className="text-gray-500 text-xs leading-relaxed">
              Enter the 6-digit merchant code. You can also use the full merchant ID if you have it.
            </Text>
          </View>
          <Input
            label="Merchant Code or ID"
            placeholder="e.g. 345623 or 33333333-3333-3333-3333-333333333333"
            autoCapitalize="none"
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
          <Button onPress={handlePayMerchant}>Continue</Button>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 text-lg font-bold">Confirm Payment</Text>
              <TouchableOpacity onPress={() => setConfirmVisible(false)} className="p-1">
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Provider</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  {method === 'utilities' 
                    ? UTILITY_PROVIDERS.find((p) => p.id === utilityProvider)?.name 
                    : 'Merchant Payment'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Account</Text>
                <Text className="text-gray-800 text-sm font-medium">{method === 'utilities' ? meterNumber : merchantCode}</Text>
              </View>
              <View className="h-px bg-gray-200 my-2" />
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 text-sm font-semibold">Amount</Text>
                <Text className="text-[#2F6B2F] text-lg font-bold">USD {Number(amount).toFixed(2)}</Text>
              </View>
            </View>

            <Text className="text-gray-500 text-xs mb-3">
              Available balance: {formatCurrency(primaryBalance?.availableBalanceMinor ?? 0, 'USD')}
            </Text>

            <TouchableOpacity
              onPress={handleConfirmPayment}
              disabled={billPay.isPending || merchantPay.isPending}
              className="bg-[#2F6B2F] rounded-xl py-4 items-center mb-2"
            >
              {billPay.isPending || merchantPay.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Confirm Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setConfirmVisible(false)}
              disabled={billPay.isPending || merchantPay.isPending}
              className="py-3 items-center"
            >
              <Text className="text-gray-500 text-sm font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Screen */}
      {success && (
        <View className="flex-1 items-center justify-center py-12 gap-4">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="checkmark" size={40} color="#16A34A" />
          </View>
          <Text className="text-gray-900 text-2xl font-bold">Payment Successful</Text>
          <Text className="text-gray-500 text-center">
            Your bill payment of USD {Number(amount).toFixed(2)} has been processed successfully.
          </Text>
          <View className="w-full bg-green-50 rounded-xl p-4 mt-2">
            <Text className="text-green-800 text-xs font-medium">Receipt sent to your email</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSuccess(false);
              router.back();
            }}
            className="w-full bg-[#2F6B2F] rounded-xl py-4 items-center mt-4"
          >
            <Text className="text-white font-bold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ActionScreen>
  );
}
