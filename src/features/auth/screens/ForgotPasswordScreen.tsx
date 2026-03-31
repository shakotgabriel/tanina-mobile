import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useForgotPassword } from '@/src/features/auth/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.description}>Enter your email and we will send reset instructions.</Text>
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <Button onPress={() => forgotPassword.mutate({ email })}>
          {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
        </Button>
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
