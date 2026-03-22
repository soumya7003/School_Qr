/**
 * app/(auth)/_layout.jsx
 * Inside Expo Router tree — Redirect works correctly here.
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isNewUser = useAuthStore((s) => s.isNewUser);

  // Root layout already blocks until isHydrated = true
  // This is a safety net only
  if (!isHydrated) return null;

  if (isAuthenticated && isNewUser) return <Redirect href="/(app)/updates" />;
  if (isAuthenticated) return <Redirect href="/(app)/home" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0F" } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}