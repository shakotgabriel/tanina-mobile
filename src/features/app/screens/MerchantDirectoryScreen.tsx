import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ActionScreen from '@/src/components/layout/ActionScreen';

type Merchant = {
  id: string;
  code: string;
  name: string;
  category: string;
  rating: number;
  city: string;
  description: string;
};

const MERCHANTS: Merchant[] = [
  {
    id: '9a2bc0f2-1ea0-4c57-a5f9-4e3f95bde12f',
    code: '345623',
    name: 'GreenMart Grocers',
    category: 'Groceries',
    rating: 4.7,
    city: 'Kampala',
    description: 'Fresh produce and daily essentials.',
  },
  {
    id: '4f5de2bd-789e-4ad7-b2c2-5f713b28ca71',
    code: '889140',
    name: 'SolarPlus Utilities',
    category: 'Utilities',
    rating: 4.5,
    city: 'Nairobi',
    description: 'Clean energy bills and subscriptions.',
  },
  {
    id: '6b786b02-a34a-4465-a5b3-21289f6ce74a',
    code: '561900',
    name: 'Kigali Eats',
    category: 'Food',
    rating: 4.9,
    city: 'Kigali',
    description: 'Restaurant and delivery payments.',
  },
  {
    id: '65f0a4d7-9ad8-4b50-a8b1-a91e80911e64',
    code: '772411',
    name: 'Juba Health Pharmacy',
    category: 'Health',
    rating: 4.6,
    city: 'Juba',
    description: 'Trusted pharmacy and clinic partner.',
  },
];

export default function MerchantDirectoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['345623', '561900']);
  const [recent] = useState<string[]>(['889140', '345623']);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return MERCHANTS;
    }

    return MERCHANTS.filter((merchant) => {
      return (
        merchant.name.toLowerCase().includes(term) ||
        merchant.code.includes(term) ||
        merchant.category.toLowerCase().includes(term) ||
        merchant.city.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const favoriteMerchants = useMemo(() => {
    return MERCHANTS.filter((merchant) => favorites.includes(merchant.code));
  }, [favorites]);

  const recentMerchants = useMemo(() => {
    return MERCHANTS.filter((merchant) => recent.includes(merchant.code));
  }, [recent]);

  const toggleFavorite = (merchantCode: string) => {
    setFavorites((prev) => {
      if (prev.includes(merchantCode)) {
        return prev.filter((code) => code !== merchantCode);
      }

      return [...prev, merchantCode];
    });
  };

  const selectMerchant = (merchant: Merchant) => {
    router.push({
      pathname: '/(app)/payments',
      params: {
        merchantCode: merchant.code,
        merchantName: merchant.name,
      },
    });
  };

  return (
    <ActionScreen title="Merchant Directory">
      <View className="gap-3">
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
          placeholder="Search by name, code, category, or city"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />

        {favoriteMerchants.length > 0 && !search ? (
          <View className="bg-white border border-gray-100 rounded-xl p-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">Favorites</Text>
            <View className="gap-2">
              {favoriteMerchants.map((merchant) => (
                <TouchableOpacity
                  key={`fav-${merchant.code}`}
                  onPress={() => selectMerchant(merchant)}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-800 text-sm font-medium">{merchant.name}</Text>
                  <Text className="text-[#2F6B2F] text-xs">{merchant.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {recentMerchants.length > 0 && !search ? (
          <View className="bg-white border border-gray-100 rounded-xl p-4">
            <Text className="text-gray-700 text-sm font-semibold mb-2">Recent</Text>
            <View className="gap-2">
              {recentMerchants.map((merchant) => (
                <TouchableOpacity
                  key={`recent-${merchant.code}`}
                  onPress={() => selectMerchant(merchant)}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-800 text-sm font-medium">{merchant.name}</Text>
                  <Text className="text-gray-500 text-xs">{merchant.city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        className="mt-4"
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isFavorite = favorites.includes(item.code);

          return (
            <TouchableOpacity
              onPress={() => selectMerchant(item)}
              activeOpacity={0.8}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-gray-900 text-base font-bold">{item.name}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{item.category} · {item.city}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{item.description}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(item.code)} className="p-1">
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={20}
                    color={isFavorite ? '#D97706' : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-[#2F6B2F] text-sm font-semibold">Code: {item.code}</Text>
                <Text className="text-amber-600 text-xs font-semibold">{item.rating.toFixed(1)} ★</Text>
              </View>

              <TouchableOpacity
                onPress={() => selectMerchant(item)}
                className="mt-3 bg-[#2F6B2F] rounded-lg py-2.5 items-center"
              >
                <Text className="text-white font-semibold text-sm">Quick Pay</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-400 text-sm">No merchants found</Text>
          </View>
        }
      />
    </ActionScreen>
  );
}
