import { Image, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionQuery } from '@/src/hooks/useQueries';

type HeaderProps = {
  user: {
    name: string;
    email?: string;
  };
  isLoading: boolean;
};

function Header({ user, isLoading }: HeaderProps) {
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
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
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
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' }}>Welcome</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 17 }}>{user.name}</Text>
          {user.email && (
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '400', lineHeight: 12, marginTop: 2 }}>
              {user.email}
            </Text>
          )}
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
  const { data: session, isLoading } = useSessionQuery(true); // Always enable in header to display user info
  
  const firstName = (session as any)?.firstName ?? '';
  const lastName = (session as any)?.lastName ?? '';
  const email = (session as any)?.email ?? '';
  
  const fallbackName = email ? email.split('@')[0] : 'User';
  const fullName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim() || fallbackName;
  const user = { name: fullName, email };

  return (
    <Tabs
      screenOptions={{
        header: () => <Header user={user} isLoading={isLoading} />,
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
          boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
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