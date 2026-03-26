/**
 * app/(app)/_layout.jsx
 *
 * PURELY STRUCTURAL — tabs + tab bar only.
 *
 * BiometricGate lives in app/_layout.jsx (root) as an overlay.
 * useInactivityLock lives in app/_layout.jsx (root) as a single listener.
 * AuthProvider owns all routing logic.
 *
 * This file does NOT import or use:
 *   - BiometricGate        ← lives in root _layout.jsx only
 *   - useInactivityLock    ← lives in root _layout.jsx only
 *   - Any <Redirect>       ← AuthProvider owns all routing
 */

import TabBar from '@/components/navigation/TabBar';
import { useAuthStore } from '@/features/auth/auth.store';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // Block render until hydrated + authenticated to prevent
    // screens from flashing with empty state.
    // AuthProvider handles the actual redirect to login.
    if (!isHydrated || !isAuthenticated) return null;

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                tabBar={(props) => <TabBar {...props} />}
                screenOptions={{ headerShown: false }}
            >
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
    );
}