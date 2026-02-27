/**
 * App Layout — Tab navigator with custom TabBar.
 */

import TabBar from '@/src/components/navigation/TabBar';
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="updates" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}