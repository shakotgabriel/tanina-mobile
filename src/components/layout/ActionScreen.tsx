import { PropsWithChildren } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'home', label: 'Home', icon: 'home-outline' as const, route: '/(app)/(tabs)/home' },
  {
    name: 'transactions',
    label: 'Transactions',
    icon: 'swap-horizontal-outline' as const,
    route: '/(app)/(tabs)/transactions',
  },
  { name: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/(app)/(tabs)/wallet' },
  { name: 'profile', label: 'Profile', icon: 'person-outline' as const, route: '/(app)/(tabs)/profile' },
];

interface ActionScreenProps extends PropsWithChildren {
  title?: string;
  onBack?: () => void;
  scrollable?: boolean;
}

export default function ActionScreen({
  children,
  title,
  onBack,
  scrollable = true,
}: ActionScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* ── Branded Header ─────────────────────────────── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 4,
          paddingHorizontal: 20,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: title ? 8 : 12,
          }}
        >
          <Image
            source={require('../../../assets/images/tani.png')}
            style={{ width: 110, height: 32 }}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {title ? (
          <View style={{ paddingBottom: 14 }}>
            <Text
              style={{ fontSize: 22, fontWeight: '700', color: '#111827', letterSpacing: -0.3 }}
            >
              {title}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Content ────────────────────────────────────── */}
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>{children}</View>
      )}

      {/* ── Tab Bar Footer ─────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(tab.route as any)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon} size={22} color="#9CA3AF" />
            <Text
              style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 3 }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
