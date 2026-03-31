import { Image, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileQuery } from '@/src/hooks/useQueries';

type HeaderProps = {
  user: {
    name: string;
  };
};

function Header({ user }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingTop: Math.max(insets.top, 12) + 4,
        paddingBottom: 12,
        paddingHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      }}
    >
      {/* Logo */}
      <Image
        source={require('../../../assets/images/tani.png')}
        style={{ width: 120, height: 34 }}
        resizeMode="contain"
      />

      {/* User pill badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#F9FCF9',
          borderWidth: 1,
          borderColor: '#D1E8D1',
          borderRadius: 999,
          paddingLeft: 12,
          paddingRight: 4,
          paddingVertical: 4,
        }}
      >
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' }}>Welcome</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 17 }}>{user.name}</Text>
        </View>
        <View
          style={{
            height: 34,
            width: 34,
            borderRadius: 17,
            backgroundColor: '#2F6B2F',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { data: profile } = useProfileQuery();
  const firstName = (profile as any)?.firstName ?? 'Me';
  const user = { name: firstName };

  return (
    <Tabs
      screenOptions={{
        header: () => <Header user={user} />,
        tabBarActiveTintColor: '#2F6B2F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 40,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}