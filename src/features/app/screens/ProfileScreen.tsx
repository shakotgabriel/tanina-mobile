import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { notify } from '@/src/lib/utils/notify';

import Screen from '@/src/components/layout/Screen';
import {
  useChangePasswordMutation,
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/src/hooks/useQueries';
import { useAuthStore } from '@/src/lib/store/authStore';
import { UserDTO } from '@/src/types';

type EditSection = 'personal' | 'email' | 'password' | null;

function kycBadge(status?: string) {
  switch (status?.toUpperCase()) {
    case 'VERIFIED': return { label: 'KYC Verified', bg: '#DCFCE7', color: '#166534' };
    case 'PENDING': return { label: 'KYC Pending', bg: '#FEF3C7', color: '#92400E' };
    case 'REJECTED': return { label: 'KYC Rejected', bg: '#FEE2E2', color: '#991B1B' };
    default: return { label: 'Not Verified', bg: '#F3F4F6', color: '#6B7280' };
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-medium flex-shrink ml-4 text-right">
        {value || '—'}
      </Text>
    </View>
  );
}

function EditField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{label}</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}

function PasswordField({
  label,
  show,
  onToggle,
  ...props
}: TextInputProps & { label: string; show: boolean; onToggle: () => void }) {
  return (
    <View className="gap-1.5">
      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{label}</Text>
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
        <TextInput
          className="flex-1 py-3 text-gray-900 text-sm"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          {...props}
        />
        <TouchableOpacity onPress={onToggle} className="ml-2 p-1">
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function humanizeValue(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function SectionCard({
  title,
  icon,
  editing,
  saving,
  saveDisabled,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  editing: boolean;
  saving: boolean;
  saveDisabled?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-[#F0F7F0] items-center justify-center">
            <Ionicons name={icon} size={15} color="#2F6B2F" />
          </View>
          <Text className="text-gray-800 text-sm font-semibold">{title}</Text>
        </View>

        {editing ? (
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={onCancel} className="px-3 py-1.5 rounded-lg border border-gray-200">
              <Text className="text-gray-500 text-xs font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={saving || saveDisabled}
              className={`flex-row items-center gap-1 px-3 py-1.5 rounded-lg ${(saving || saveDisabled) ? 'bg-[#2F6B2F]/50' : 'bg-[#2F6B2F]'}`}
            >
              {saving
                ? <ActivityIndicator size={12} color="#fff" />
                : <Ionicons name="checkmark" size={14} color="#fff" />}
              <Text className="text-white text-xs font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onEdit}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100"
          >
            <Ionicons name="pencil-outline" size={13} color="#2F6B2F" />
            <Text className="text-[#2F6B2F] text-xs font-semibold">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className={editing ? 'border-t border-gray-100 pt-3' : 'border-t border-gray-100 pt-3'}>
        {children}
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { data, isLoading } = useProfileQuery(true); // Enable query when viewing profile
  const profile = data as unknown as UserDTO;
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const updateProfile = useUpdateProfileMutation();
  const changePassword = useChangePasswordMutation();

  const [editSection, setEditSection] = useState<EditSection>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join('') || '?';

  const kyc = kycBadge(profile?.kycStatus);

  const normalizedProfileFirstName = (profile?.firstName ?? '').trim();
  const normalizedProfileLastName = (profile?.lastName ?? '').trim();
  const normalizedProfilePhone = (profile?.phoneNumber ?? '').trim();
  const normalizedProfileEmail = (profile?.email ?? '').trim().toLowerCase();

  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  const normalizedPhone = phone.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const hasPersonalChanges =
    normalizedFirstName !== normalizedProfileFirstName ||
    normalizedLastName !== normalizedProfileLastName ||
    normalizedPhone !== normalizedProfilePhone;

  const hasEmailChanges = normalizedEmail !== normalizedProfileEmail;

  const canSavePassword =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length >= 8 &&
    confirmPassword.trim().length > 0 &&
    newPassword === confirmPassword;

  function openSection(section: EditSection) {
    if (section === 'personal') {
      setFirstName(profile?.firstName ?? '');
      setLastName(profile?.lastName ?? '');
      setPhone(profile?.phoneNumber ?? '');
    } else if (section === 'email') {
      setEmail(profile?.email ?? '');
    } else if (section === 'password') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
    setEditSection(section);
  }

  function savePersonal() {
    if (!hasPersonalChanges) {
      setEditSection(null);
      return;
    }

    updateProfile.mutate(
      { firstName: normalizedFirstName, lastName: normalizedLastName, phoneNumber: normalizedPhone || undefined },
      {
        onSuccess: () => {
          setEditSection(null);
          notify.success('Profile updated');
        },
        onError: () => {
          notify.error('Update failed', 'Could not update profile. Please try again.');
        },
      }
    );
  }

  function saveEmail() {
    if (!normalizedEmail.includes('@')) {
      notify.validation('Invalid email');
      return;
    }

    if (!hasEmailChanges) {
      setEditSection(null);
      return;
    }

    updateProfile.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setEditSection(null);
          notify.success('Email updated');
        },
        onError: () => {
          notify.error('Update failed', 'Could not update email. Please try again.');
        },
      }
    );
  }

  function savePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      notify.validation('Missing fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.validation('Password mismatch');
      return;
    }
    if (newPassword.length < 8) {
      notify.validation('Password too short');
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setEditSection(null);
          notify.success('Password updated');
        },
        onError: () => {
          notify.error('Update failed', 'Could not change password. Check your current password.');
        },
      }
    );
  }

  async function performLogout() {
    await clearAuth();
    router.replace('/(auth)/login');
  }

  function confirmLogout() {
    if (Platform.OS === 'web') {
      const accepted = globalThis.confirm('Are you sure you want to logout?');
      if (accepted) {
        void performLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void performLogout() },
    ]);
  }

  return (
    <Screen scrollable>
      {isLoading ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#2F6B2F" />
          <Text className="text-gray-500 text-sm mt-3">Loading your profile...</Text>
        </View>
      ) : (
        <>
      {/* ── Avatar header card ─────────────────────────────── */}
      <View className="bg-[#2F6B2F] rounded-2xl p-5 mb-5 items-center">
        <View
          className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3"
          style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}
        >
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#FFFFFF' }}>{initials}</Text>
        </View>
        <Text className="text-white text-xl font-bold">
          {profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : 'Your Name'}
        </Text>
        <Text className="text-white/60 text-sm mt-0.5">{profile?.email ?? '—'}</Text>

        <View className="flex-row gap-2 mt-3">
          <View
            style={{
              backgroundColor: kyc.bg,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: kyc.color, fontSize: 11, fontWeight: '600' }}>
              {kyc.label}
            </Text>
          </View>
          {profile?.accountType ? (
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>
                {humanizeValue(profile.accountType)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Personal Information ────────────────────────────── */}
      <SectionCard
        title="Personal Information"
        icon="person-outline"
        editing={editSection === 'personal'}
        saving={updateProfile.isPending}
        saveDisabled={!hasPersonalChanges}
        onEdit={() => openSection('personal')}
        onCancel={() => setEditSection(null)}
        onSave={savePersonal}
      >
        {editSection === 'personal' ? (
          <View className="gap-4">
            <EditField
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />
            <EditField
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
            />
            <EditField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+256 700 000 000"
            />
          </View>
        ) : (
          <View className="gap-2">
            <InfoRow label="First Name" value={profile?.firstName} />
            <InfoRow label="Last Name" value={profile?.lastName} />
            <InfoRow label="Phone" value={profile?.phoneNumber} />
          </View>
        )}
      </SectionCard>

      {/* ── Email Address ───────────────────────────────────── */}
      <SectionCard
        title="Email Address"
        icon="mail-outline"
        editing={editSection === 'email'}
        saving={updateProfile.isPending}
        saveDisabled={!hasEmailChanges}
        onEdit={() => openSection('email')}
        onCancel={() => setEditSection(null)}
        onSave={saveEmail}
      >
        {editSection === 'email' ? (
          <EditField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="your@email.com"
          />
        ) : (
          <InfoRow label="Email" value={profile?.email} />
        )}
      </SectionCard>

      {/* ── Change Password ─────────────────────────────────── */}
      <SectionCard
        title="Change Password"
        icon="lock-closed-outline"
        editing={editSection === 'password'}
        saving={changePassword.isPending}
        saveDisabled={!canSavePassword}
        onEdit={() => openSection('password')}
        onCancel={() => setEditSection(null)}
        onSave={savePassword}
      >
        {editSection === 'password' ? (
          <View className="gap-4">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
            <Text className="text-gray-500 text-xs">
              Password must be at least 8 characters and match confirmation.
            </Text>
          </View>
        ) : (
          <InfoRow label="Password" value="••••••••" />
        )}
      </SectionCard>

      {/* ── Account Info (read-only) ────────────────────────── */}
      <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-full bg-[#F0F7F0] items-center justify-center">
            <Ionicons name="shield-checkmark-outline" size={15} color="#2F6B2F" />
          </View>
          <Text className="text-gray-800 text-sm font-semibold">Account Details</Text>
        </View>
        <View className="border-t border-gray-100 pt-3 gap-2">
          <InfoRow label="Account Type" value={humanizeValue(profile?.accountType ?? 'BASIC')} />
          <InfoRow label="Status" value={humanizeValue(profile?.status ?? 'ACTIVE')} />
          {profile?.createdAt ? (
            <InfoRow
              label="Member Since"
              value={new Date(profile.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            />
          ) : null}
        </View>
      </View>

      {/* ── Logout ─────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={confirmLogout}
        className="flex-row items-center justify-center gap-2 border border-red-100 bg-red-50 rounded-2xl py-4 mt-1 mb-6"
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text className="text-red-500 font-semibold text-base">Logout</Text>
      </TouchableOpacity>
        </>
      )}
    </Screen>
  );
}
