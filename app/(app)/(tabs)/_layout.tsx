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
      className="flex-row items-center justify-between bg-white border-b border-gray-100 px-5 pb-3 shadow-sm"
      style={{ paddingTop: Math.max(insets.top, 12) + 4 }}
    >
      {/* Logo — style prop required for reliable RN image sizing */}
      <Image
        source={require('../../../assets/images/tani.png')}
        style={{ width: 120, height: 34 }}
        resizeMode="contain"
      />

      {/* User pill badge */}
      <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1 py-1">
        <View className="items-end">
          <Text className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Welcome</Text>
          <Text className="text-[13px] font-semibold text-gray-800 leading-[16px]">{user.name}</Text>
        </View>
        <View className="h-8 w-8 rounded-full bg-[#2F6B2F] items-center justify-center">
          <Text className="text-white text-[12px] font-bold">{initials}</Text>
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