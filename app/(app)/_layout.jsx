/**
 * app/(app)/_layout.jsx
 *
 * BUGS FIXED:
 *
 *   [FIX-1] Double-redirect conflict with AuthProvider:
 *           The original had BOTH a render-time <Redirect> AND AuthProvider's
 *           useEffect guard doing navigation. When isNewUser=true, the layout
 *           rendered <Redirect href="/(app)/updates"> at the same time
 *           AuthProvider fired router.replace('/(app)/updates'). This caused
 *           a race/double-navigation that could land the user on a blank screen
 *           or loop. Fixed: removed all <Redirect> calls from this layout.
 *           AuthProvider is the single source of truth for routing — this
 *           layout only handles rendering (null while loading).
 *
 *   [FIX-2] isNewUser check blocked /updates rendering:
 *           `if (isNewUser && !onUpdates) return <Redirect href="/(app)/updates" />`
 *           ran on EVERY render including the initial mount of /updates itself.
 *           While onUpdates was correctly checked, the render-time redirect fired
 *           before the screen could mount, causing a flash. AuthProvider's reactive
 *           useEffect handles this more gracefully.
 *
 *   [FIX-3] Removed isNewUser and segments dependencies entirely from this layout.
 *           This component should be purely structural — BiometricGate + TabBar.
 *           All auth/routing logic belongs in AuthProvider.
 */

import BiometricGate from "@/components/auth/BiometricGate.jsx";
import TabBar from "@/components/navigation/TabBar";
import { useAuthStore } from "@/features/auth/auth.store";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { Tabs } from "expo-router";
import { View } from "react-native";

export default function AppLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const inactivityHandlers = useInactivityLock();

  // [FIX-1,2,3] No Redirect calls here — AuthProvider owns all routing.
  // Just block render until hydrated + authenticated to prevent screens
  // from flashing with empty state.
  if (!isHydrated || !isAuthenticated) return null;

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
          <Tabs.Screen name="change-phone" options={{ href: null }} />
        </Tabs>
      </View>
    </BiometricGate>
  );
}