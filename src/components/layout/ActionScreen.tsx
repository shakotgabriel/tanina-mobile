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
  const contentWrapperStyle = {
    width: '100%' as const,
    maxWidth: 520,
    alignSelf: 'center' as const,
  };

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
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
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
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={contentWrapperStyle}>{children}</View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={contentWrapperStyle}>{children}</View>
        </View>
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
          boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
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
