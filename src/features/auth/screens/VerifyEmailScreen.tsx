import { useLocalSearchParams, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useResendOtp, useVerifyEmail } from '@/src/features/auth/hooks/useAuth';

export default function VerifyEmailScreen() {
  const verify = useVerifyEmail();
  const resendOtp = useResendOtp();
  const { email = '' } = useLocalSearchParams<{ email?: string | string[] }>();
  const normalizedEmail = Array.isArray(email) ? (email[0] ?? '') : email;
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const isComplete = otp.length === 6;

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const canResend = !resendOtp.isPending && !!normalizedEmail && resendCooldown === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Green Header ────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread-outline" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.headline}>Check your email</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
          <View style={styles.emailBadge}>
            <Ionicons name="mail-outline" size={13} color="#2F6B2F" style={{ marginRight: 5 }} />
            <Text style={styles.emailBadgeText} numberOfLines={1}>
              {normalizedEmail || 'your email address'}
            </Text>
          </View>
        </View>

        {/* ── White Card ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.label}>Verification code</Text>
          <Text style={styles.hint}>Enter the 6-digit code from your inbox</Text>

          {/* Large OTP input */}
          <TextInput
            style={[styles.otpInput, isComplete && styles.otpInputComplete]}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#D1D5DB"
            textAlign="center"
            autoFocus
          />

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < otp.length ? styles.dotFilled : null,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!isComplete || verify.isPending) && styles.buttonDisabled,
            ]}
            onPress={() => verify.mutate({ email: normalizedEmail, otp })}
            disabled={!isComplete || verify.isPending || !normalizedEmail}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {verify.isPending ? 'Verifying…' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Didn't receive the code?"}</Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => {
                resendOtp.mutate({ email: normalizedEmail });
                setResendCooldown(30);
              }}
              disabled={!canResend}
            >
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                {resendOtp.isPending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>

          <Link href="/login" style={styles.backLink}>
            ← Back to login
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2F6B2F' },
  header: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    maxWidth: '85%',
  },
  emailBadgeText: {
    color: '#2F6B2F',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 28,
  },
  otpInput: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  otpInputComplete: {
    borderColor: '#2F6B2F',
    backgroundColor: '#F0F7F0',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotFilled: {
    backgroundColor: '#2F6B2F',
  },
  button: {
    backgroundColor: '#2F6B2F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 4px 8px rgba(47, 107, 47, 0.25)',
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  footerText: { fontSize: 13, color: '#6B7280' },
  resendText: { fontSize: 13, color: '#2F6B2F', fontWeight: '700' },
  resendTextDisabled: { opacity: 0.45 },
  backLink: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
