// app/_layout.jsx
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Providers from '../src/providers/index';
import BiometricGate from '../src/components/auth/BiometricGate';
import { useInactivityLock } from '../src/hooks/useInactivityLock';
import { useBiometricStore } from '../src/store/biometricStore';

// ── Stores that need hydrating on cold start ──────────────────────────────────
import { useAuthStore } from '../src/features/auth/auth.store';
import { useProfileStore } from '../src/features/profile/profile.store';

function InnerLayout() {
    const { setAppReady } = useBiometricStore();

    // ── CRITICAL: hydrate both stores on cold start ───────────────────────────
    // Without this, isHydrated stays false forever → AuthProvider never
    // navigates → blank screen.
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const hydrateProfile = useProfileStore((s) => s.hydrate);

    useEffect(() => {
        // Run both hydrations in parallel on mount
        Promise.all([hydrateAuth(), hydrateProfile()]).catch(() => {
            // Hydration errors are handled inside each store — safe to ignore here
        });
    }, []);

    // ── Biometric: start AppState listener ────────────────────────────────────
    useInactivityLock();

    // ── Biometric: mark app ready after navigator paints ─────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setAppReady(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.root}>
            {/* Stack always mounts unconditionally */}
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
            </Stack>

            <StatusBar style="auto" />

            {/* Biometric overlay — returns null when not locked */}
            <BiometricGate />
        </View>
    );
}

export default function RootLayout() {
    return (
        <Providers>
            <InnerLayout />
        </Providers>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});