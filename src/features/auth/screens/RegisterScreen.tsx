import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useRegister } from '@/src/features/auth/hooks/useAuth';

export default function RegisterScreen() {
  const register = useRegister();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('BASIC');

  const ACCOUNT_TYPES = [
    { value: 'BASIC', label: 'Basic', icon: 'person-outline' },
    { value: 'PREMIUM', label: 'Premium', icon: 'star-outline' },
    { value: 'MERCHANT', label: 'Merchant', icon: 'storefront-outline' },
    { value: 'AGENT', label: 'Agent', icon: 'briefcase-outline' },
  ] as const;

  const passwordStrength =
    password.length === 0 ? null
    : password.length < 6 ? 'weak'
    : password.length < 10 ? 'fair'
    : 'strong';

  const strengthColor =
    passwordStrength === 'weak' ? '#EF4444'
    : passwordStrength === 'fair' ? '#F59E0B'
    : '#2F6B2F';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Green Header ────────────────────────── */}
        <View style={styles.header}>
          <Image
            source={require('../../../../assets/images/tani.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headline}>Create your account</Text>
          <Text style={styles.subtitle}>Join thousands managing money with Tanina</Text>
        </View>

        {/* ── White Card ──────────────────────────── */}
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* First + Last name row */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>First name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Last name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <Text style={styles.label}>Phone number</Text>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+256 700 000 000"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 8 characters"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Account type */}
          <Text style={[styles.label, { marginTop: 6 }]}>Account type</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map(({ value, label, icon }) => {
              const active = accountType === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setAccountType(value)}
                  activeOpacity={0.8}
                  style={[
                    styles.typeCard,
                    active ? styles.typeCardActive : null,
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={active ? '#2F6B2F' : '#9CA3AF'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                    {label}
                  </Text>
                  {active && (
                    <View style={styles.typeCheck}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Password strength bar */}
          {passwordStrength && (
            <View style={styles.strengthRow}>
              {['weak', 'fair', 'strong'].map((level, i) => (
                <View
                  key={level}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        i <= (['weak', 'fair', 'strong'].indexOf(passwordStrength))
                          ? strengthColor
                          : '#E5E7EB',
                    },
                  ]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)} password
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, register.isPending && styles.buttonDisabled, { marginTop: 24 }]}
            onPress={() => register.mutate({ firstName, lastName, email, password, phoneNumber: phone, accountType })}
            disabled={register.isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {register.isPending ? 'Creating account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/login" asChild>
            <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}>
              <Text style={styles.outlineButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2F6B2F' },
  header: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logo: { width: 150, height: 42, tintColor: '#FFFFFF', marginBottom: 18 },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardContent: { padding: 24, paddingBottom: 48 },
  nameRow: { flexDirection: 'row', marginBottom: 0 },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  typeCardActive: {
    borderColor: '#2F6B2F',
    backgroundColor: '#F0F7F0',
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  typeLabelActive: {
    color: '#2F6B2F',
  },
  typeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2F6B2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827' },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -12,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  button: {
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2F6B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  outlineButtonText: { color: '#2F6B2F', fontSize: 16, fontWeight: '700' },
});
