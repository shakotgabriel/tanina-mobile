import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useRegister } from '@/src/features/auth/hooks/useAuth';

export default function RegisterScreen() {
  const register = useRegister();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Input label="Full name" value={fullName} onChangeText={setFullName} />
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button onPress={() => register.mutate({ fullName, email, password })}>
          {register.isPending ? 'Creating...' : 'Register'}
        </Button>
        <Link href="/login" style={styles.link}>Already have an account?</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  link: {
    color: '#0284C7',
    fontWeight: '600',
  },
});
