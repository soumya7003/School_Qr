/**
 * app/(app)/_layout.jsx
 * Inside Expo Router tree — Redirect works correctly here.
 */

import BiometricGate from "@/components/auth/BiometricGate.jsx";
import TabBar from "@/components/navigation/TabBar";
import { useAuthStore } from "@/features/auth/auth.store";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { Redirect, Tabs, useSegments } from "expo-router";
import { View } from "react-native"; // FIX 1: was react-native-web

// FIX 2: isDeviceRooted completely removed — already runs in root _layout.jsx
// Running it twice = wasteful + shows duplicate security alerts

export default function AppLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const segments = useSegments();

  // FIX 3: useInactivityLock moved ABOVE early returns — Rules of Hooks
  // Hooks must never be called after a conditional return
  const inactivityHandlers = useInactivityLock();

  if (!isHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const onUpdates = segments[1] === "updates";
  if (isNewUser && !onUpdates) return <Redirect href="/(app)/updates" />;

  return (
    <BiometricGate>
      <View style={{ flex: 1 }} {...inactivityHandlers}>
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
      </View>
    </BiometricGate>
  );
}