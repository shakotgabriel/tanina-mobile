import { Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';

export default function ConvertScreen() {
  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Convert currency</Text>
        <Input label="From amount" keyboardType="decimal-pad" />
        <Input label="To currency" autoCapitalize="characters" maxLength={3} />
        <Button>Get quote</Button>
      </View>
    </Screen>
  );
}
