/**
 * App Layout — Tab navigator with custom TabBar.
 */

import BiometricGate from '@/components/auth/BiometricGate.jsx';
import TabBar from '@/components/navigation/TabBar';
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <BiometricGate>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {/* ── Visible tab bar screens ── */}
        <Tabs.Screen name="home" />
        <Tabs.Screen name="qr" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="updates" />
        <Tabs.Screen name="settings" />

        {/* ── Settings sub-screens (hidden from tab bar) ── */}
        <Tabs.Screen name="visibility" options={{ href: null }} />
        <Tabs.Screen name="scan-history" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
        <Tabs.Screen name="change-phone" options={{ href: null }} />
      </Tabs>
    </BiometricGate>
  );
}