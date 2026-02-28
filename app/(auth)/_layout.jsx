import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0F' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}