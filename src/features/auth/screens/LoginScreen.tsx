import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';
import { useLogin } from '@/src/features/auth/hooks/useAuth';

export default function LoginScreen() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button onPress={() => login.mutate({ email, password })}>
          {login.isPending ? 'Signing in...' : 'Login'}
        </Button>
        <Link href="/register" style={styles.link}>Create an account</Link>
        <Link href="/forgot-password" style={styles.link}>Forgot password?</Link>
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
    marginBottom: 8,
  },
  link: {
    color: '#0284C7',
    fontWeight: '600',
  },
});
