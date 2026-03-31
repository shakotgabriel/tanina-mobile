import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useVerifyEmail } from '@/src/features/auth/hooks/useAuth';

export default function VerifyEmailScreen() {
  const verify = useVerifyEmail();
  const [code, setCode] = useState('');

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>Enter the code sent to your email to continue.</Text>
        <Input label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" />
        <Button onPress={() => verify.mutate({ code })}>{verify.isPending ? 'Verifying...' : 'Verify'}</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  description: {
    color: '#475569',
    marginBottom: 8,
  },
});
