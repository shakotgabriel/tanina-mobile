import { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '@/src/lib/utils/notify';

import { Button, Input } from '@/src/components/common';
import ActionScreen from '@/src/components/layout/ActionScreen';
import MethodSelector, { Method } from '@/src/features/app/components/MethodSelector';
import CountryPicker, {
  Country,
} from '@/src/features/app/components/CountryPicker';
import { useAgentDepositMutation } from '@/src/hooks/useQueries';
import { useFormValidation } from '@/src/hooks/useFormValidation';

type Step = 'select_method' | 'select_country' | 'form';
type DepositMethod = 'agent';

const DEPOSIT_METHODS: Method[] = [
  {
    id: 'agent',
    icon: 'person-outline',
    title: 'Deposit via Agent',
    description: 'Credit your wallet through a registered agent account',
  },
];

export default function DepositScreen() {
  const router = useRouter();
  const deposit = useAgentDepositMutation();
  const [step, setStep] = useState<Step>('select_method');
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [agentUserId, setAgentUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const formValues = useMemo(() => ({ agentUserId, amount }), [agentUserId, amount]);
  const { errors, validateField, touchField } = useFormValidation(
    {
      agentUserId: (value) => (String(value).trim() ? null : 'Deposit agent code is required'),
      amount: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? null : 'Amount must be greater than 0';
      },
    },
    formValues
  );

  function handleBack() {
    if (step === 'form' && method === 'agent') {
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
    setStep('form');
  }

  const stepTitle: Record<Step, string> = {
    select_method: 'Deposit',
    select_country: 'Select Country',
    form: 'Deposit via Agent',
  };

  const handleAgentDeposit = () => {
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

    deposit.mutate(
      {
        agentId: agentUserId,
        amountMinor: Math.round(Number(amount) * 100),
        currency: country.currency,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: () => {
          notify.error('Agent deposit failed', 'Please confirm the agent ID and try again');
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

      {step === 'form' && method === 'agent' && country && (
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
            label="Agent Code"
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
          <Input
            label="Note (Optional)"
            placeholder="e.g. Counter deposit at branch"
            value={note}
            onChangeText={setNote}
          />
          <Button onPress={handleAgentDeposit} disabled={deposit.isPending}>
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
            Your deposit of {amount} {country?.currency} via agent code {agentUserId} has been initiated.
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
