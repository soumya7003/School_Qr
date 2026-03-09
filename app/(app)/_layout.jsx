/**
 * app/(app)/_layout.jsx
 * Inside Expo Router tree — Redirect works correctly here.
 */

import BiometricGate from "@/components/auth/BiometricGate.jsx";
import TabBar from "@/components/navigation/TabBar";
import { useAuthStore } from "@/features/auth/auth.store";
import { Redirect, Tabs, useSegments } from "expo-router";

export default function AppLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const segments = useSegments();

  // Root layout already blocks until isHydrated = true
  // This is a safety net only
  if (!isHydrated) return null;

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const onUpdates = segments[1] === "updates";
  if (isNewUser && !onUpdates) return <Redirect href="/(app)/updates" />;

  return (
    <BiometricGate>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="qr" />
        <Tabs.Screen name="emergency" />
        <Tabs.Screen name="updates" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="visibility" options={{ href: null }} />
        <Tabs.Screen name="scan-history" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
      </Tabs>
    </BiometricGate>
  );
}