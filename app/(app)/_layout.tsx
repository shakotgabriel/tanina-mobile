import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="send" />
      <Stack.Screen name="deposit" />
      <Stack.Screen name="convert" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="payments" />
    </Stack>
  );
}
