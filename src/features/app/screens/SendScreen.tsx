import { Text, View } from 'react-native';

import { Button, Input } from '@/src/components/common';
import Screen from '@/src/components/layout/Screen';

export default function SendScreen() {
  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Send money</Text>
        <Input label="Recipient phone or email" />
        <Input label="Amount" keyboardType="decimal-pad" />
        <Button>Continue</Button>
      </View>
    </Screen>
  );
}
